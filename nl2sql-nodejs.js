const oracledb = require('oracledb');
const http = require('http');
const express = require("express");
const console = require('console');
const app = express();
var tables = []
var columns = []
var data = []
var compere = ['More', 'Less', 'Equal', 'higher', 'Lower']
const questionsWords = ['what', 'which']
const verb = ['IS', 'ARE', 'DOES', 'WORKS', 'WORK', 'IN', 'HAS', 'HAVE', 'HAD']
const other = ['IN', 'OF', 'THAN', 'THE', 'ALL']
const tableHasFk = ['EMPLOYEE', 'SALARY_PAYMENT']
var results = []
var tab = ''
var col = ''
app.listen(3000, () => {
    console.log("http://localhost:3000/");
});


// serve your css as static 
app.use(express.static(__dirname));
app.use(express.json())
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});



app.post("/", (req, res) => {
    const { Qustion } = req.body
    const arrayOfQuestion = Qustion.split(' ');
    verb.map((veb) => {
        arrayOfQuestion.map((word, index) => {
            if (word.indexOf(`'s`) != -1) {
                arrayOfQuestion[index] = word.substr(0, word.indexOf(`'s`))
            }
            if (veb === word.toUpperCase()) {
                arrayOfQuestion.splice(index, 1)
            }
        })
    })
    other.map((item) => {
        arrayOfQuestion.map((word, index) => {
            if (item === word.toUpperCase()) {
                arrayOfQuestion.splice(index, 1)
            }
        })
    })
    console.log(arrayOfQuestion)
    getTable(arrayOfQuestion).then(() => {
        console.log({ tables })
        getData(tables).then(() => {

            getColumn(arrayOfQuestion).then(() => {
                getSelection(tab, col, questionsWords, arrayOfQuestion, data).then(() => {
                    console.log({ results });
                    res.send(results)
                    results = []
                    tables = []
                    columns = []
                    col = ''
                    tab = ''
                    data = []
                })
            })
        })
    })
});

async function getTable(arrayOfQuestion) {
    let connection;
    try {
        connection = await oracledb.getConnection({ user: "compiler", password: "compiler", connectionString: "localhost:1521/orcl" });

        console.log("Successfully connected to Oracle Database");
        // Now query the rows back 
        // select table_name from user_tables  

        result = await connection.execute(
            `select table_name from user_tables`, [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rs = result.resultSet;
        let row;
        while ((row = await rs.getRow())) {
            tables.push(row.TABLE_NAME)
        }
        tables.map((item) => {
            arrayOfQuestion.map((part, x) => {
                if (item.match(part.toUpperCase())) {
                    if (item.match(part.toUpperCase()).index == 0) {
                        tab = item
                        arrayOfQuestion.splice(x, 1);
                    }
                }
            })
        })
        await rs.close();
        // getColumn(arrayOfQuestion); 
        return tab
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

async function getColumn(arrayOfQuestion) {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: "compiler", password:
                "compiler", connectionString: "localhost:1521/orcl"
        });
        console.log("Successfully connected to Oracle Database");
        // Now query the rows back
        result = await connection.execute(
            `select column_name from user_tab_columns`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rs = result.resultSet;
        let row;
        while ((row = await rs.getRow())) {
            columns.push(row.COLUMN_NAME)
        }
        arrayOfQuestion.map((part, index) => {
            columns.map((item) => {
                if (item.match(part.toUpperCase()) != null) {
                    col = item
                    arrayOfQuestion.splice(index, 1)
                }
            })
        })
        await rs.close();
        // getSelection(tab,col) 
        return col
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}




async function getSelection(table, column, questionsWords, arrayOfQuestion, data) {
    let connection;
    try {
        connection = await oracledb.getConnection({ user: "compiler", password: "compiler", connectionString: "localhost:1521/orcl" });
        console.log("Successfully connected to Oracle Database");
        var quary = ``
        arrayOfQuestion.map((word, index) => {
            questionsWords.map(async (ask) => {
                if (word.toUpperCase() === ask.toUpperCase()) {
                    if (word.toUpperCase() === 'WHAT') {
                        arrayOfQuestion.splice(index, 1)
                        if (column == '') {
                            column = '*'
                        }
                        if (!arrayOfQuestion.length) {
                            quary = `select ${column} from ${table}`
                        } else {
                            for (let index = 0; index < data.length; index++) {
                                let title = data[index][0].NAME
                                if (title != undefined) {
                                    if (title.toUpperCase().match(arrayOfQuestion[0].toUpperCase())) {

                                        let secTable = data[index + 1][0]
                                        quary = `select ${column} from ${table} JOIN ${secTable} 
                                         on ${table}.${secTable}_id = ${secTable}.id 
                                         where ${secTable}.name = '${arrayOfQuestion[0]}'`
                                        arrayOfQuestion.splice(0, 1)
                                        break;
                                    }
                                }
                            }
                            if (arrayOfQuestion.length) {
                                compere.map((item) => {
                                    let uppercase = arrayOfQuestion[0].toUpperCase()
                                    if (uppercase.match(item.toUpperCase())) {
                                        if (item === 'higher') {
                                            quary = `select MAX(amount) from ${table}`
                                        } else if (item === 'Lower') {
                                            quary = `select MIN(amount) from ${table}`
                                        }
                                    }
                                })
                            }
                        }
                        console.log(quary)
                    } else if (word.toUpperCase() === 'WHICH') {
                        arrayOfQuestion.splice(index, 1)
                        if (column == '') {
                            column = '*'
                        }
                        for (let index = 0; index < data.length; index++) {
                            let title = data[index][0].NAME
                            if (title != undefined) {
                                if (title.toUpperCase().match(arrayOfQuestion[0].toUpperCase())) {
                                    let secTable = data[index + 1][0].toUpperCase()
                                    let firstTable = table.toUpperCase()
                                    tableHasFk.map((fkTable) => {
                                        if (secTable.match(fkTable) && !firstTable.match(fkTable)) {
                                            console.log("Reverce")
                                            quary = `select ${column} from ${secTable} JOIN ${firstTable} 
                                         on ${secTable}.${firstTable}_id = ${firstTable}.id 
                                         where ${secTable}.name = '${arrayOfQuestion[0]}'`
                                        }
                                    })
                                    if (quary === ``) {
                                        quary = `select ${column} from ${table} 
                                         JOIN ${secTable}  
                                         on ${table}.${secTable}_id = ${secTable}.id
                                         where ${secTable}.name = '${arrayOfQuestion[0]}'`
                                    }
                                    arrayOfQuestion.splice(0, 1)
                                    break
                                }
                            }
                        }
                        if (arrayOfQuestion.length) {
                            console.log(arrayOfQuestion)
                            compere.map((item) => {
                                let uppercase = arrayOfQuestion[0].toUpperCase()
                                if (uppercase.match(item.toUpperCase())) {
                                    if (item === 'More') {
                                        quary = `SELECT * FROM employee JOIN salary_payment 
                                           ON salary_payment.employee_id = employee.id 
                                           WHERE salary_payment.amount > ${arrayOfQuestion[1]}`
                                    } else if (item === 'Less') {
                                        quary = `SELECT * FROM employee JOIN salary_payment 
                                           ON salary_payment.employee_id = employee.id
                                           WHERE salary_payment.amount < ${arrayOfQuestion[1]}`
                                    } else if (item === 'Equal') {
                                        quary = `SELECT * FROM employee JOIN salary_payment
                                            ON salary_payment.employee_id = employee.id
                                            WHERE salary_payment.amount = ${arrayOfQuestion[1]}`
                                    }
                                }
                            })
                        }
                        console.log(quary)
                    }
                }
            })
        })
        result = await connection.execute(
            quary,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rs = result.resultSet;
        let row;
        while ((row = await rs.getRow())) {
            results.push(row)
        }
        await rs.close();
        return (results)
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}



async function getData(table) {
    let connection;

    try {
        connection = await oracledb.getConnection({ user: "compiler", password: "compiler", connectionString: "localhost:1521/orcl" });
        console.log("Successfully connected to Oracle Database");
        // Now query the rows back 
        // select table_name from user_tables 
        for (let index = 0; index < table.length; index++) {
            result = await connection.execute(
                `select * from ${table[index]} `,
                [],
                { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
            const rs = result.resultSet;
            let row;
            while ((row = await rs.getRow())) {
                data.push([row], [table[index]])
            }
            await rs.close();
        }
        return (data)
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }

}



