

const express = require("express");
const bodyParser = require("body-parser");
const mongoose =require("mongoose");
const _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://To-do-list:Himanshutododb@cluster0.zkiah8s.mongodb.net/todolistDB", {useNewUrlParser:true});

const itemSchema={
  name:String
};

const Item = mongoose.model("Item", itemSchema);    
const item1= new Item({
    name:"Welcome BhaiLog"
});

const item2= new Item({
  name:"Hit + button to add"
});

const item3= new Item({
  name:"<--Hit the checkbox to delete"
});

const defaultItems=[item1, item2, item3];

const listSchema={
  name:String,
  items:[itemSchema]
};

const List=mongoose.model("List",listSchema);



app.get("/", function(req, res) {

  Item.find({}).then(foundItems =>{
    if(foundItems.length===0){
       Item.insertMany(defaultItems)
      .then(function () {
        console.log("Successfully saved defult items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    } 
  });
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    try {
      await item.save();
      res.redirect("/");
    } catch (err) {
      // Handle the error
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName }).exec();
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      // Handle the error
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
});


app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully removed");
    } catch (err) {
      // Handle the error
      console.error(err);
    }
    res.redirect("/");
  } else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    } catch (err) {
      // Handle the error
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
});




app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName }).exec();

    if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (err) {
    // Handle the error
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});



app.get("/about", function(req, res){
  res.render("about");
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
