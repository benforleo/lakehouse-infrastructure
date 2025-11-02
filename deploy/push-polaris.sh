#!/usr/bin/env zsh
set -e

VERSION="$1"

echo "Pulling Polaris image from Docker Hub..."
podman pull apache/polaris:"${VERSION}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Logging in to AWS ECR..."
aws ecr get-login-password --region us-east-1 | podman login --username AWS --password-stdin "${ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com

echo "Pushing Polaris image to AWS ECR..."
podman tag apache/polaris:"${VERSION}" "${ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com/polaris:"${VERSION}"
podman push "${ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com/polaris:"${VERSION}"