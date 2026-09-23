# Static website hosting straight from S3 keeps the demo simple and cheap.
# Production would put CloudFront (HTTPS, caching) in front with a private bucket + OAC.

resource "random_id" "dashboard_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "dashboard" {
  bucket        = "${var.project}-dashboard-${random_id.dashboard_suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_website_configuration" "dashboard" {
  bucket = aws_s3_bucket.dashboard.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "dashboard" {
  bucket                  = aws_s3_bucket.dashboard.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "dashboard_public_read" {
  bucket = aws_s3_bucket.dashboard.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicRead"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.dashboard.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.dashboard]
}
