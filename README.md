# RDS Parameter Group Comparison Tool

This Node.js application compares two Amazon RDS parameter groups (standard DB parameter groups or DB cluster parameter groups) and generates a report of matching, non-matching, and exclusive parameters. It uses the AWS SDK to fetch RDS parameter groups, allows the user to select two groups, and then compares them.

## Features
- Fetches both **DB parameter groups** (standard RDS groups) and **DB cluster parameter groups** (Aurora and other cluster-based databases).
- Compares two selected parameter groups, highlighting:
  - Matching parameters
  - Non-matching parameters (values differ)
  - Parameters that are exclusive to one of the two groups
- Generates a text file report for easy sharing.

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
   - Generate a comparison report in the format:

   ```
   rds-parameter-comparison-group1-vs-group2.txt
   ```

### Example Report

The report includes:
- **Matching Parameters**: Parameters that exist in both groups and have the same value.
- **Non-Matching Parameters**: Parameters that exist in both groups but have different values.
- **Exclusive Parameters**: Parameters that exist only in one of the groups.

### Sample Output

```
Comparison between RDS Parameter Groups: my-db-param-group and aurora-cluster-param-group
===============================================================

1. Matching Parameters:
max_connections: 100
...

2. Non-Matching Parameters:
autocommit: Group1: ON, Group2: OFF
...

3. Exclusive to my-db-param-group:
character_set_client: utf8
...

4. Exclusive to aurora-cluster-param-group:
aurora_lab_mode: enabled
...
```

## Code Structure

- **`compare-rds-params.js`**: Main script that fetches RDS parameter groups, compares them, and generates the report.
- **AWS SDK**: Used to interact with AWS RDS API to fetch and compare parameter groups.
- **Inquirer**: Used for user input prompts to select parameter groups.

## Customization

1. **Output Format**: The current output is a plain text file. You can modify the `writeReportToFile` function to output in CSV, JSON, or any other format.
2. **Engine Families**: You can extend or modify the `getClusterParameterGroups` and `getParameterGroups` functions to fetch specific parameter groups based on database engine versions or families.

## Troubleshooting

1. **Missing Parameter Groups**: Ensure that your AWS credentials have the proper permissions to access both **DB parameter groups** and **DB cluster parameter groups**.
2. **Timeouts**: If you're working with a large number of parameters, the process might take longer. Adjust any SDK timeouts or handle pagination as needed.

## License

This project is licensed under the MIT License.

---

Let me know if you'd like any further modifications!
