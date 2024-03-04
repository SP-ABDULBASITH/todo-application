const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http:localhost:3000/");
    });
  } catch (error) {
    console.log(`DBError : ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestBody) => {
  return requestBody.status !== undefined;
};

const hasSearchProperties = (requestBody) => {
  return requestBody.priority !== undefined && requestBody.status !== undefined;
};

const hasCategoryProperties = (requestBody) => {
  return requestBody.priority !== undefined && requestBody.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestBody) => {
  return requestBody.priority !== undefined && requestBody.status !== undefined;
};

const hasPriorityAndCategoryProperties = (requestBody) => {
  return requestBody.priority !== undefined && requestBody.status !== undefined;
};

const output = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.dueDate,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO%20DO" ||
          status === "IN%20PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE status = '${status}' and priority = '${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data);
        } else {
          response.status(400);
          response.status("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.status("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO%20DO" ||
          status === "IN%20PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE status = '${status}' and category = '${category}';`;
          data = await db.all(getTodoQuery);
          response.send(data);
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.status("Invalid Todo Category");
      }
      break;
    case hasPriorityAndCategoryProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          category === "HOME" ||
          category === "WORK" ||
          category === "LEARNING"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE category = '${category}' and priority = '${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data);
        } else {
          response.status(400);
          response.status("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.status("Invalid Todo Priority");
      }
      break;

    case hasStatusProperties(request.query):
      if (
        status === "TO%20DO" ||
        status === "IN%20PROGRESS" ||
        status === "DONE"
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.status("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperties(request.query):
      try {
        if (
          category === "HOME" ||
          category === "WORK" ||
          category === "LEARNING"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE category = '${category}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachObject) => output(eachObject)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } catch (e) {
        console.log(e.message);
      }
      break;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoQuery = await db.get(getTodoQuery);
  response.send(todoQuery);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getDateQuery = `SELECT * FROM todo WHERE due_date = '${date}';`;
  const dueDateList = await db.all(getDateQuery);
  response.send(dueDateList);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const addTodoQuery = `INSERT INTO todo (id,todo,category,priority,status,due_date)
    VALUES (
        '${id}',
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let column, text, arg;
  if (status !== undefined) {
    column = "status";
    text = "Status Done";
    arg = status;
  } else if (priority !== undefined) {
    column = "priority";
    text = "Priority Updated";
    arg = priority;
  } else if (todo !== undefined) {
    column = "status";
    text = "Todo Updated";
    arg = todo;
  } else if (category !== undefined) {
    column = "category";
    text = "Category Updated";
    arg = category;
  } else if (dueDate !== undefined) {
    column = "due_date";
    text = "Due Date Updated";
    arg = dueDate;
  }
  console.log(column);
  console.log(text);
  console.log(arg);
  const selectQuery = `UPDATE todo
  SET '${column}' = '${arg}'
  WHERE id = ${todoId};`;
  await db.run(selectQuery);
  response.send(text);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Delete");
});
