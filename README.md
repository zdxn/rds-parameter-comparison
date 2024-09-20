# RDS Parameter Group Comparison Tool

This Node.js application compares two Amazon RDS parameter groups (standard DB parameter groups or DB cluster parameter groups) and generates a report of matching, non-matching, and exclusive parameters in an easy-to-read HTML format. It uses the AWS SDK to fetch RDS parameter groups, allows the user to select two groups, and then compares them.

## Features
- Fetches both **DB parameter groups** (standard RDS groups) and **DB cluster parameter groups** (Aurora and other cluster-based databases).
- Compares two selected parameter groups, highlighting:
  - Matching parameters
  - Non-matching parameters (values differ)
  - Parameters that are exclusive to one of the two groups
- Generates an HTML file with tables for each section, making it easy to read and share.

## Prerequisites

1. **Node.js**: Make sure you have Node.js installed (version 16.x or later recommended).

2. **AWS SDK Credentials**: The AWS SDK requires credentials to interact with your AWS account. You can set them up in the following ways:
   - Use AWS CLI with the credentials configured.
   - Set the environment variables:
     ```bash
     export AWS_ACCESS_KEY_ID=your-access-key-id
     export AWS_SECRET_ACCESS_KEY=your-secret-access-key
     export AWS_REGION=your-region
     ```

3. **RDS Access**: Ensure the IAM user or role has the necessary permissions to list and describe RDS parameter groups and DB cluster parameter groups.

## Installation

1. Clone this repository or download the files.

2. Install the required dependencies:

   ```bash
   npm install
   ```

## Usage

1. Run the application:

   ```bash
   node compare-rds-params.js
   ```

2. The application will:
   - Fetch all available DB parameter groups and DB cluster parameter groups from your AWS account.
   - Prompt you to select two parameter groups to compare.
   - Generate a comparison report in HTML format, saved as:

   ```
   rds-parameter-comparison-group1-vs-group2.html
   ```

3. Open the HTML file in any browser to view the comparison.

### Example HTML Report

The report includes tables for:
- **Matching Parameters**: Parameters that exist in both groups and have the same value.
- **Non-Matching Parameters**: Parameters that exist in both groups but have different values.
- **Exclusive Parameters**: Parameters that exist only in one of the groups.

### Sample HTML Output

Here is an example of what the HTML report might look like:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RDS Parameter Group Comparison</title>
  <style>
    body { font-family: Arial, sans-serif; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Comparison between RDS Parameter Groups: group1 and group2</h1>

  <h2>Matching Parameters</h2>
  <table border="1" cellpadding="5" cellspacing="0">
    <thead>
      <tr><th>Name</th><th>Value</th></tr>
    </thead>
    <tbody>
      <tr><td>max_connections</td><td>100</td></tr>
      <!-- More matching parameters -->
    </tbody>
  </table>

  <h2>Non-Matching Parameters</h2>
  <table border="1" cellpadding="5" cellspacing="0">
    <thead>
      <tr><th>Name</th><th>Group1 Value</th><th>Group2 Value</th></tr>
    </thead>
    <tbody>
      <tr><td>autocommit</td><td>ON</td><td>OFF</td></tr>
      <!-- More non-matching parameters -->
    </tbody>
  </table>

  <h2>Exclusive to group1</h2>
  <table border="1" cellpadding="5" cellspacing="0">
    <thead>
      <tr><th>Name</th><th>Value</th></tr>
    </thead>
    <tbody>
      <tr><td>character_set_client</td><td>utf8</td></tr>
      <!-- More exclusive parameters for group1 -->
    </tbody>
  </table>

  <h2>Exclusive to group2</h2>
  <table border="1" cellpadding="5" cellspacing="0">
    <thead>
      <tr><th>Name</th><th>Value</th></tr>
    </thead>
    <tbody>
      <tr><td>aurora_lab_mode</td><td>enabled</td></tr>
      <!-- More exclusive parameters for group2 -->
    </tbody>
  </table>

</body>
</html>
```

## Code Structure

- **`compare-rds-params.js`**: Main script that fetches RDS parameter groups, compares them, and generates the report in HTML.
- **AWS SDK**: Used to interact with AWS RDS API to fetch and compare parameter groups.
- **Inquirer**: Used for user input prompts to select parameter groups.

## Customization

1. **HTML Styles**: You can modify the inline CSS in the generated HTML report to adjust styling (e.g., colors, fonts, table formatting).
2. **Additional Fields**: If you want to include additional information or fields in the comparison, you can modify the `compareParameters` function and add them to the report.

## Troubleshooting

1. **Missing Parameter Groups**: Ensure that your AWS credentials have the proper permissions to access both **DB parameter groups** and **DB cluster parameter groups**.
2. **Timeouts**: If you're working with a large number of parameters, the process might take longer. Adjust any SDK timeouts or handle pagination as needed.
