# GitHub Actions deploy role (OIDC federated) for THIS repo only.
#
# The OIDC provider resource itself (aws_iam_openid_connect_provider,
# url = token.actions.githubusercontent.com) is owned by the backend repo's
# infra/modules/iam -- IAM OIDC providers are unique per URL per AWS
# account, so this stack looks it up via a data source instead of declaring
# a second aws_iam_openid_connect_provider resource for the same URL, which
# would just error as a duplicate.
#
# Separate role from the backend's own github_deploy role, not a broader
# `sub` condition added there -- least privilege per repo: this role only
# ever needs S3 sync + CloudFront invalidation, never ECR/ECS/Route53
# write, so a compromised token from this repo can't touch backend infra.
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "github_oidc_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.repo_owner}/${var.repo_name}:ref:refs/heads/${var.deploy_branch}"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "amazatic-github-deploy-frontend"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_assume.json
}

resource "aws_iam_role_policy" "github_deploy" {
  name = "amazatic-frontend-deploy-permissions"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.frontend.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject",
        ]
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = aws_cloudfront_distribution.frontend.arn
      }
    ]
  })
}
