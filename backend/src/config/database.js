import { DgraphClient, DgraphClientStub } from 'dgraph-js-http';
import dotenv from 'dotenv';

dotenv.config();

const DGRAPH_URL = process.env.DGRAPH_URL || 'http://localhost:8080';

// Create Dgraph client stub
const clientStub = new DgraphClientStub(DGRAPH_URL);

// Create Dgraph client
const dgraphClient = new DgraphClient(clientStub);

export default dgraphClient;
export { clientStub };
