const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
let isValid = require("date-fns/isValid");

const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;

const intializingdbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server starts at http://localhost:3000/todos");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};

intializingdbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const SearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  /*console.log(hasPriorityAndStatus(request.query));
  console.log(hasCategoryAndStatus(request.query));
  console.log(hasCategoryAndPriority(request.query));
  console.log(hasPriority(request.query));
  console.log(hasStatus(request.query));
  console.log(hasCategory(request.query));
  console.log(SearchProperty(request.query));*/

  switch (true) {
    //scenaro 1

    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
              SELECT * from todo where status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachitem) => outPutResult(eachitem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    // scenario 2

    case hasPriority(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        getTodosQuery = `
               Select * from todo where priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachitem) => outPutResult(eachitem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    // scenario  3

    case hasPriorityAndStatus(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `select * from todo where status = '${status}' and priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachitem) => outPutResult(eachitem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    // scenario 4

    case SearchProperty(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachitem) => outPutResult(eachitem)));

      break;

    // scenario 5

    case hasCategoryAndStatus(request.query):
      if (category == WORK || category == HOME || category == LEARNING) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `Select * from todo where category = '${category}' and status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachitem) => outPutResult(eachitem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Category");
      }

      break;

    // scenario 6

    case hasCategory(request.query):
      if (category == "WORK" || category == "HOME" || category == "LEARNING") {
        getTodosQuery = `select * from todo where category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachitem) => outPutResult(eachitem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    // scenario 7

    case hasCategoryAndPriority(request.query):
      if (category == WORK || category == HOME || category == LEARNING) {
        if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
          getTodosQuery = `select * from todo where category = '${category}' and priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachitem) => outPutResult(eachitem)));
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

    // scenario last
  }
});

// api 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id='${todoId}';`;
  const responseResult = await db.get(getTodoQuery);
  response.send(outPutResult(responseResult));
});

// api 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `select * from todo where due_date='${newDate}';`;
    const responseResult = await db.all(requestQuery);
    response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// api 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
  INSERT INTO
    todo (id, todo, category,priority, status, due_date)
  VALUES
    (${id}, '${todo}', '${category}','${priority}', '${status}', '${postNewDueDate}');`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// api 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    //update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${newDueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }

  /*updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;
  const responseData = await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);*/
});

//api6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
