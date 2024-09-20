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

    // Append the fetched parameter groups
    parameterGroups.push(...response.DBParameterGroups.map(group => ({
      name: group.DBParameterGroupName,
      type: 'db-parameter-group'
    })));

    // Check if there is a next page
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

    // Append the fetched cluster parameter groups
    clusterParameterGroups.push(...response.DBClusterParameterGroups.map(group => ({
      name: group.DBClusterParameterGroupName,
      type: 'db-cluster-parameter-group'
    })));

    // Check if there is a next page
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

    // Append the fetched parameters
    parameters.push(...response.Parameters);

    // Check if there is a next page
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

    // Append the fetched parameters
    parameters.push(...response.Parameters);

    // Check if there is a next page
    nextToken = response.Marker;
  } while (nextToken);

  return parameters.reduce((acc, param) => {
    acc[param.ParameterName] = param.ParameterValue;
    return acc;
  }, {});
}

// Function to compare two parameter groups
function compareParameters(group1Params, group2Params) {
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
        nonMatching.push({ name, group1Value: value, group2Value: group2Params[name] });
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

// Function to write comparison report to a file
function writeReportToFile(report, group1, group2) {
  const filename = `rds-parameter-comparison-${group1}-vs-${group2}.txt`;
  const content = `
    Comparison between RDS Parameter Groups: ${group1} and ${group2}
    ===============================================================

    1. Matching Parameters:
    ${report.matching.map(p => `${p.name}: ${p.value}`).join("\n")}

    2. Non-Matching Parameters:
    ${report.nonMatching.map(p => `${p.name}: Group1: ${p.group1Value}, Group2: ${p.group2Value}`).join("\n")}

    3. Exclusive to ${group1}:
    ${report.exclusiveToGroup1.map(p => `${p.name}: ${p.value}`).join("\n")}

    4. Exclusive to ${group2}:
    ${report.exclusiveToGroup2.map(p => `${p.name}: ${p.value}`).join("\n")}
  `;

  fs.writeFileSync(filename, content.trim());
  console.log(`Report generated: ${filename}`);
}

// Main function
async function main() {
  // Step 1: Get available DB parameter groups and DB cluster parameter groups
  const standardParameterGroups = await getParameterGroups();
  const clusterParameterGroups = await getClusterParameterGroups();

  // Combine them for user selection
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
  const report = compareParameters(group1Params, group2Params);

  // Step 5: Write the report to a file
  writeReportToFile(report, group1Name, group2Name);
}

main().catch(err => console.error("Error:", err));
