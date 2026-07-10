variable "region" {
  type    = string
  default = "us-east-1"
}

# --- GitHub Actions OIDC deploy role ---
variable "repo_owner" {
  type    = string
  default = "sanket17-amazatic"
}

variable "repo_name" {
  type    = string
  default = "amazatic-project-status-fe"
}

variable "deploy_branch" {
  type    = string
  default = "main"
}
