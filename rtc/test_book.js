import { mysql } from "mysql";

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Rasel#22386779',
    database: 'free_call',
    timezone: 'utc'

});


db.connect((err) => {
    if (err) {
        throw err;
    }
    logger.info('mysql connected....');
});

            
const dataToInsert = {
    name: 'John Doe',
    mobile_number: 28,
    mail: 'john@example.com'
};

const query = 'INSERT INTO users (name, mobile_number, mail) VALUES (?, ?, ?)';

connection.query(query, [dataToInsert.name, dataToInsert.mobile_number, dataToInsert.mail], (err, results) => {
    if (err) {
        console.error('Error inserting data:', err);
        return;
    }
    console.log('Data inserted successfully:', results);
});

