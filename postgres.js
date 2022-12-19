import { Configuration, OpenAIApi } from 'openai';
import * as dotenv from 'dotenv';
import { format } from 'sql-formatter';
import postgres from 'postgres'

dotenv.config();

const tableName = 'flights';
// const question = 'What percentage of American Airline flight departures are delayed more than 30 minutes?';
// const question = 'What percentage of flight arrivals are delayed more than 30 minutes?';
// const question = 'What percentage of flights depart from New York state?'
const question = 'Which 10 airports are experieincing the most arrival delays?'
// const question = 'What percentage of flights are Delayed?'
console.log(`\n${question}`);

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'demo',
  username: 'postgres',
  password: 'password',
  debug: true,
});

const tableSchema = await sql`
  SELECT 
    table_name, 
    column_name, 
    data_type 
  FROM 
    information_schema.columns
  WHERE 
    table_name = 'flights';
`;

const columns = tableSchema.map(ts => ts.column_name).join(', ');
const schema = `Table ${tableName}, columns = [${columns}]`;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const context = 'Create a PostgreSQL query answering the question';
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

console.log(data.text);

const query = format(data.text);

console.log(`\n\n${query}\n\n`);

const r = await sql.unsafe(query);

console.table(r);

sql.CLOSE
