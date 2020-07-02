import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import uploadConfig from '../config/upload';

import CreateTransactionService from './CreateTransactionService';

import Transaction from '../models/Transaction';

interface Request {
  filename: string;
}

interface CreateTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const createTransaction = new CreateTransactionService();

    const csvFilePath = path.resolve(uploadConfig.directory, filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const CSVData: CreateTransaction[] = [];

    parseCSV.on('data', line => {
      CSVData.push({
        title: line[0],
        type: line[1],
        value: Number(line[2]),
        category: line[3],
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactions = [];

    for (const data of CSVData) {
      const transaction = await createTransaction.execute(data);

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
