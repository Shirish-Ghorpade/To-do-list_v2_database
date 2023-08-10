//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
mongoose.set("strictQuery", false);
mongoose.connect(
  "mongodb+srv://" + process.env.MONGODB_CONNECTION_STRING,
  function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Connected to MongoDB");
    }
  }
);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemSchema = {
  name: String,
};
const Item = new mongoose.model("Item", itemSchema);

const listSchema = {
  name: String,
  items: [itemSchema],
};
const List = new mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist !",
});
const item2 = new Item({
  name: "Hit the + button to add new item",
});
const item3 = new Item({
  name: "<--- Hit this to delete the item",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find(function (err, foundItems) {
    if (err) {
      console.log(err);
    }
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Sucess");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) {
      console.log(err);
    } else if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

// Added new tasks to the db and website
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listTitle === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, function (err, foundList) {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listTitle);
      }
    });
  }
  // Database madhe change kela aata tho change webiste var disava mahun every time redirect karayche get method
  // madhe get method madhe ch ka karan get method madhe re.render aahe data send karnyasathi
});
// After Checkbox is get checked then it get deleted in the database
app.post("/delete", function (req, res) {
  const deletedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.deleteOne({ _id: deletedItemId }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Sucessfully Deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: deletedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// List.deleteMany({name : "favicon.ico"}, function(err){
//   if(err){
//     console.log(err);
//   }else{
//     console.log("Sucessfully Deleted");
//   }
// });

// Instead of this we use the Dyanmic route in above code
// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });
//
// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(process.env.PORT, function () {
  console.log("Server started on port 3000");
});
