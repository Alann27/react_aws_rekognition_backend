import mysql from "mysql2/promise";
import {databaseInfo} from './config.js';

let connection = await mysql
  .createConnection({
    host: databaseInfo.endpoint,
    port: databaseInfo.port,
    user: databaseInfo.user,
    password: databaseInfo.password,
    database: databaseInfo.database,
  });

  await connection.execute(
    "CREATE TABLE if not exists users (id int not null auto_increment, name varchar(50), lastName varchar(100), email varchar(50),password varchar(50), imgUrl varchar(5000), primary key (id))"
  );

  export default connection;
