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

# --- Frontend build config ---
variable "vite_api_base_url" {
  type        = string
  default     = "https://api.amazatic-project-status.in"
  description = "Backend API base URL baked into the frontend build. Currently duplicated as a hardcoded literal in .github/workflows/deploy.yml's VITE_API_BASE_URL env var -- exposed as an output (outputs.tf) so that workflow can read it from an Actions variable instead, if/when that switch is made."
}
