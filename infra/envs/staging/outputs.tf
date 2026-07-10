output "frontend_domain" {
  description = "Public hostname for the frontend SPA -- an alias to CloudFront, TLS-terminated."
  value       = aws_route53_record.frontend.name
}

output "frontend_bucket_name" {
  description = "S3 bucket the deploy workflow syncs dist/ into. Set as this repo's S3_BUCKET Actions variable."
  value       = aws_s3_bucket.frontend.id
}

output "frontend_distribution_id" {
  description = "CloudFront distribution ID the deploy workflow invalidates after each sync. Set as this repo's CLOUDFRONT_DISTRIBUTION_ID Actions variable."
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_deploy_role_arn" {
  description = "Set as this repo's AWS_DEPLOY_ROLE_ARN Actions secret."
  value       = aws_iam_role.github_deploy.arn
}
