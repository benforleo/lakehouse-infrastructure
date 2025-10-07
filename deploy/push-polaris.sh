#!/usr/bin/env zsh

set -e

echo "Pulling Polaris image from Docker Hub..."
podman pull apache/polaris:1.1.0-incubating

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Logging in to AWS ECR..."
aws ecr get-login-password --region us-east-1 | podman login --username AWS --password-stdin "${ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com

echo "Pushing Polaris image to AWS ECR..."
podman tag apache/polaris:1.1.0-incubating "${ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com/polaris:1.1.0-incubating
podman push "${ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com/polaris:1.1.0-incubating