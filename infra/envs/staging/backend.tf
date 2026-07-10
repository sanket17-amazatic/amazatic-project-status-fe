# Own state key in the SAME shared S3 bucket + DynamoDB lock table the
# backend repo's infra/ already bootstrapped (amazatic-project-status-backend
# infra/envs/staging/backend.tf) -- one bucket for all of this project's
# Terraform state, one key per stack. A different key ("staging/frontend...",
# not "staging/terraform...") keeps this stack's state fully separate from
# the backend's -- two independent `terraform apply`s, no shared lock
# contention, no risk of one stack's plan clobbering the other's resources.
terraform {
  backend "s3" {
    bucket         = "amazatic-project-status-tfstate-105028894201"
    key            = "staging/frontend.tfstate"
    region         = "us-east-1"
    dynamodb_table = "amazatic-project-status-tfstate-lock"
    encrypt        = true
  }
}
