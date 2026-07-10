# Static frontend hosting -- S3 + CloudFront, TLS-terminated at
# app.amazatic-project-status.in. This is its OWN Terraform stack/state
# (backend.tf), separate from the amazatic-project-status-backend repo's
# infra/ -- but the two share the same AWS account and the same Route53
# hosted zone api.<domain> already lives on, so the zone is looked up here
# via a data source rather than re-created (a second aws_route53_zone
# resource for the same domain would either error or silently fork DNS
# ownership between two states).
#
# S3 bucket is private (no public access, no S3 static-website-hosting
# mode) -- CloudFront reaches it via Origin Access Control (OAC), the
# current AWS-recommended mechanism (replaces the older OAI). Unlike a
# stateful app origin, caching IS enabled here (CachingOptimized), and
# custom_error_response rewrites 403/404 to /index.html so React Router's
# client-side routes (e.g. /projects/5, which has no matching S3 object)
# don't 403 at the edge.
#
# Cache-Control split (immutable long-cache on hashed assets, no-cache on
# index.html) is set by .github/workflows/deploy.yml's `aws s3 sync`/`cp`
# calls, not here -- Terraform owns the distribution's default behavior,
# not per-object headers.

data "aws_caller_identity" "current" {}

data "aws_route53_zone" "this" {
  name = "amazatic-project-status.in"
}

resource "aws_s3_bucket" "frontend" {
  bucket = "amazatic-project-status-frontend-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "amazatic-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Bucket policy only allows reads from THIS distribution specifically
# (AWS:SourceArn condition) -- not just any CloudFront distribution in the
# account.
data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    sid       = "AllowCloudFrontServicePrincipal"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}

# ACM cert for CloudFront MUST be in us-east-1 -- var.region defaults there,
# so no separate provider alias is needed.
resource "aws_acm_certificate" "frontend" {
  domain_name       = "app.amazatic-project-status.in"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.this.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.value]
}

resource "aws_acm_certificate_validation" "frontend" {
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for r in aws_route53_record.frontend_cert_validation : r.fqdn]
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  comment             = "amazatic frontend SPA -- S3 + CloudFront"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # cheapest tier (US/Canada/Europe) -- fine for an internal tool
  aliases             = ["app.amazatic-project-status.in"]

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS managed: CachingOptimized
    compress               = true
  }

  # React Router client-side routes have no matching S3 object -- OAC-gated
  # S3 returns 403 (not 404) for a missing key with no public ListBucket,
  # so both codes get rewritten to a 200 /index.html and the SPA's own
  # router takes over from there.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.frontend.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = "app.amazatic-project-status.in"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
