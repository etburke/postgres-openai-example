import { Configuration, OpenAIApi } from 'openai';
import * as dotenv from 'dotenv';
import { format } from 'sql-formatter';
import { ConnectionFactory } from 'pinot-client';
import axios from 'axios';

dotenv.config();

const tableName = 'airlineStats';
// const question = 'What percentage of American Airline flight departures are delayed more than 30 minutes?';
// const question = 'What percentage of flight arrivals are delayed more than 30 minutes?';
const question = 'What percentage of flights depart from New York state?'
// const question = 'Which airports are experieincing the most arrival delays?'
console.log(`\n${question}`);
// fetch table information from pinot so we can send GPT the schema
const tableConfig = await axios.get(`http://localhost:9000/tableConfigs/${tableName}`);

const columns = tableConfig.data.schema.dimensionFieldSpecs.map(dfs => dfs.name).join(', ');
const schema = `Table ${tableName}, columns = [${columns}]`;

const connection = ConnectionFactory.fromHostList(["localhost:8000"]);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const context = 'Create a ANSI MySQL Calcite query answering the question';
// const context = 'Create an Apache Calcite MYSQL_ANSI SQL query answering the question';
// const context = 'Create an Apache Calcite MYSQL_ANSI SQL query to execute using Apache Pinot answering the question';
const prompt = `\"\"\"\n${schema}\n\"\"\"\n\n${context} ${question}`;

const response = await openai.createCompletion({
  model: "text-davinci-003",
  prompt,
  temperature: 0.7,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
});

const data = response.data.choices[0];
const query = format(data.text);

console.log(`\n\n${query}\n\n`);

const r = await connection.execute(
    tableName, // table name
    query // SQL query
);

console.log(`Scanned ${r.numDocsScanned} docs in ${r.timeUsedMs}ms`);
console.log("Results:");
console.log(r.resultTable.dataSchema.columnNames.join("\t"));
console.table(r.resultTable.rows);
