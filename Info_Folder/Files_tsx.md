# Detailed Breakdown: `src/pages/Files.tsx`

## 1. Overview & Importance
This page acts as a Google Drive clone for the specific project. 

**What problem it solves:**
It provides a UI for users to upload files and organize them into folders. When a user uploads a file here, the frontend uses a `multipart/form-data` request to send the actual binary file data to our Node server, which then streams it to an AWS S3 bucket.

## 2. Line-by-Line Breakdown
- **File Upload Forms**: It uses the browser's native `<input type="file" />` but intercepts the submit event so it can upload asynchronously without refreshing the page.
- **S3 URLs**: The data returned from the backend is just a string (e.g., `https://bucket.s3.amazonaws.com/file.pdf`), which this component uses to render a clickable download link or an image preview.
