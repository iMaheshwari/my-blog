import express from "express";
import { MongoClient } from "mongodb";

import path from "path";
const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(express.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      // useNewUrlParser: true,
    });
    const db = client.db("my-blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to DB", error });
  }
};

// Get Article By name
app.get("/api/articles/:name", async ({ params }, res) => {
  withDB(async (db) => {
    const articleName = params.name;

    const article = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(article);
  }, res);
});

// Upvote Article by name
app.post("/api/articles/:name/upvote", async ({ body, params }, res) => {
  withDB(async (db) => {
    const articleName = params.name;
    const article = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { upvotes: article.upvotes + 1 } }
      );

    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticle);
  }, res);
});

// Add comment to article
app.post("/api/articles/:name/add-comment", ({ body, params }, res) => {
  const { username, comment } = body;
  const articleName = params.name;

  withDB(async (db) => {
    const article = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: article.comments.concat({ username, comment }),
        },
      }
    );

    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticle);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/build/index.html"));
});

app.listen(8000, () => console.log("listening on port 8000"));
