const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); //serve up static folder

//connect to mongoDB via mongoose
mongoose.connect("mongodb://localhost:27017/TodolistDB");

//defined schema for object
const itemSchema = new mongoose.Schema({
    name: String
})

//defined item collection(Table) for object
const Item = mongoose.model("Item", itemSchema);

//create new objects
const item1 = new Item({
    name: "This is a To-do-list"
});

const item2 = new Item({
    name: "Enter your To-do for the day"
});

const item3 = new Item({
    name: "Once entered, click the + button"
});

//place objects into an array
const defaultItems = [item1, item2, item3];

//defined schema for list
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

//defined list collection(Table) for object
const List = mongoose.model("List", listSchema);

//render home ejs
app.get("/", function(req, res) {

    //pass all data from Item Model from database, to server as Javascript objects
    Item.find({}, function(err, foundItems) {
        if (err) {
            console.log(err);
        } else {
            //if array foundItems is empty, insert the array defaultItems(defined above) into array, also can insert single objects
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Item inserted into database successfully");
                    }
                });
                //redirect the webpage to "/" which wil now run the else statement below
                res.redirect("/");
            } else {
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            }
        }
    });
});

//render work ejs
app.get("/:listName", function(req, res) {
    const listRequested = _.capitalize(req.params.listName);

    //find the ":listName" user input and check to see if it exists
    List.findOne({ name: listRequested }, async function(err, foundList) {
        if (!err) {
            if (!foundList) {
                //create new list document(Row)
                const list = new List({
                    name: listRequested,
                    items: defaultItems //inserted the array of objects in defaultItems array
                });
                //save list document(Row)
                await list.save();

                //redirect the webpage to "/:listName" which wil now run the else statement below
                res.redirect("/" + listRequested);
            } else {
                //show exisiting list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    })
})

//post function
app.post("/", function(req, res) {

    const itemName = req.body.newItem; //grabs the value of newItem inputed by user in list.ejs
    const listName = req.body.list; //grabs the value of List inputed by user in list.ejs

    //creates a new Item(model name) document
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") { //if list is default list, item will save and redirect to default page
        item.save();
        res.redirect("/");
    } else {
        //searches for the custom list collection, item will save to the custom list and redirect to custom page
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
})

app.post("/delete", function(req, res) {

    //gets value of the name "checkbox" in list.ejs
    const checkItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted item")
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, //get this list
            { $pull: { items: { _id: checkItemId } } }, //pull this attribute item, that has this id
            function(err, foundList) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            }
        )
    }


});

//listen to Port:3000
app.listen(3000, function() {
    console.log("Site is up on Port:3000");
});