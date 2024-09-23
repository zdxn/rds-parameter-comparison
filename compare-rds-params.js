const { RDSClient, DescribeDBParameterGroupsCommand, DescribeDBClusterParameterGroupsCommand, DescribeDBParametersCommand, DescribeDBClusterParametersCommand } = require("@aws-sdk/client-rds");
const inquirer = require('inquirer').default;
const fs = require("fs");

// Initialize RDS Client
const rdsClient = new RDSClient({ region: process.env.AWS_REGION });

// Function to get available DB parameter groups (standard RDS)
async function getParameterGroups() {
  const parameterGroups = [];
  let nextToken = undefined;

  do {
    const command = new DescribeDBParameterGroupsCommand({ Marker: nextToken });
    const response = await rdsClient.send(command);

    parameterGroups.push(...response.DBParameterGroups.map(group => ({
      name: group.DBParameterGroupName,
      type: 'db-parameter-group'
    })));

    nextToken = response.Marker;
  } while (nextToken);

  return parameterGroups;
}

// Function to get available DB cluster parameter groups (Aurora)
async function getClusterParameterGroups() {
  const clusterParameterGroups = [];
  let nextToken = undefined;

  do {
    const command = new DescribeDBClusterParameterGroupsCommand({ Marker: nextToken });
    const response = await rdsClient.send(command);

    clusterParameterGroups.push(...response.DBClusterParameterGroups.map(group => ({
      name: group.DBClusterParameterGroupName,
      type: 'db-cluster-parameter-group'
    })));

    nextToken = response.Marker;
  } while (nextToken);

  return clusterParameterGroups;
}

// Function to get parameters for DB parameter group
async function getParameters(parameterGroupName) {
  const parameters = [];
  let nextToken = undefined;

  do {
    const command = new DescribeDBParametersCommand({
      DBParameterGroupName: parameterGroupName,
      Marker: nextToken,
    });
    const response = await rdsClient.send(command);

    parameters.push(...response.Parameters);

    nextToken = response.Marker;
  } while (nextToken);

  return parameters.reduce((acc, param) => {
    acc[param.ParameterName] = param.ParameterValue;
    return acc;
  }, {});
}

// Function to get parameters for DB cluster parameter group
async function getClusterParameters(parameterGroupName) {
  const parameters = [];
  let nextToken = undefined;

  do {
    const command = new DescribeDBClusterParametersCommand({
      DBClusterParameterGroupName: parameterGroupName,
      Marker: nextToken,
    });
    const response = await rdsClient.send(command);

    parameters.push(...response.Parameters);

    nextToken = response.Marker;
  } while (nextToken);

  return parameters.reduce((acc, param) => {
    acc[param.ParameterName] = param.ParameterValue;
    return acc;
  }, {});
}

// Function to compare two parameter groups
function compareParameters(group1Params, group2Params, group1Name, group2Name) {
  const matching = [];
  const nonMatching = [];
  const exclusiveToGroup1 = [];
  const exclusiveToGroup2 = [];

  // Compare parameters in both groups
  for (const [name, value] of Object.entries(group1Params)) {
    if (group2Params.hasOwnProperty(name)) {
      if (group2Params[name] === value) {
        matching.push({ name, value });
      } else {
        nonMatching.push({ name, [group1Name]: value, [group2Name]: group2Params[name] });
      }
    } else {
      exclusiveToGroup1.push({ name, value });
    }
  }

  // Parameters exclusive to group2
  for (const [name, value] of Object.entries(group2Params)) {
    if (!group1Params.hasOwnProperty(name)) {
      exclusiveToGroup2.push({ name, value });
    }
  }

  return { matching, nonMatching, exclusiveToGroup1, exclusiveToGroup2 };
}

// Function to write comparison report to an HTML file with dynamic group headers
function writeReportToFile(report, group1, group2) {
  const filename = `rds-parameter-comparison-${group1}-vs-${group2}.html`;

  const generateTable = (title, data, columns) => `
    <h2>${title}</h2>
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${data.map(row => `<tr>${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;

  const htmlContent = `
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
      <h1>Comparison between RDS Parameter Groups: ${group1} and ${group2}</h1>

      ${generateTable('Matching Parameters', report.matching, ['name', 'value'])}
      ${generateTable('Non-Matching Parameters', report.nonMatching, ['name', group1, group2])}
      ${generateTable(`Exclusive to ${group1}`, report.exclusiveToGroup1, ['name', 'value'])}
      ${generateTable(`Exclusive to ${group2}`, report.exclusiveToGroup2, ['name', 'value'])}

    </body>
    </html>
  `;

  fs.writeFileSync(filename, htmlContent.trim());
  console.log(`HTML report generated: ${filename}`);
}

// Main function
async function main() {
  const standardParameterGroups = await getParameterGroups();
  const clusterParameterGroups = await getClusterParameterGroups();
  const allParameterGroups = [...standardParameterGroups, ...clusterParameterGroups];

  if (allParameterGroups.length < 2) {
    console.log("Not enough parameter groups found to compare.");
    return;
  }

  // Step 2: Prompt user to select two groups
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "group1",
      message: "Select the first parameter group to compare:",
      choices: allParameterGroups.map(group => `${group.name} (${group.type})`),
    },
    {
      type: "list",
      name: "group2",
      message: "Select the second parameter group to compare:",
      choices: allParameterGroups.map(group => `${group.name} (${group.type})`),
    },
  ]);

  const group1Name = answers.group1.split(' ')[0];
  const group1Type = answers.group1.split(' ')[1].replace(/[()]/g, '');

  const group2Name = answers.group2.split(' ')[0];
  const group2Type = answers.group2.split(' ')[1].replace(/[()]/g, '');

  // Step 3: Get parameters for both groups based on their type (db-parameter-group or db-cluster-parameter-group)
  const group1Params = group1Type === 'db-parameter-group'
    ? await getParameters(group1Name)
    : await getClusterParameters(group1Name);

  const group2Params = group2Type === 'db-parameter-group'
    ? await getParameters(group2Name)
    : await getClusterParameters(group2Name);

  // Step 4: Compare the parameter groups
  const report = compareParameters(group1Params, group2Params, group1Name, group2Name);

  // Step 5: Write the report to an HTML file
  writeReportToFile(report, group1Name, group2Name);
}

main().catch(err => console.error("Error:", err));
