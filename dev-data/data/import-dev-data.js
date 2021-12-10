const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../Models/tourModel');
const Review = require('../../Models/reviewModel');
const User = require('../../Models/userModel');

dotenv.config({
    path: './config.env',
});

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log(`DB connection succesful`));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, {
            validateBeforeSave: false,
        });
        await Review.create(reviews);
        // console.log('Data loaded');
    } catch (error) {
        console.error(error);
    }
    process.exit();
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        // console.log('Data deleted');
    } catch (error) {
        // console.error(error);
    }
    process.exit();
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
