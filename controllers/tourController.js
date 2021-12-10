const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../Models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image')) {
        callback(null, true);
    } else {
        callback(new AppError('Not an image!', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
    {
        name: 'imageCover',
        maxCount: 1,
    },
    {
        name: 'images',
        maxCount: 3,
    },
]);

// upload.single('image)
// upload.array('images', 5)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) {
        return next();
    }

    // Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, index) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${
                index + 1
            }.jpeg`;

            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    );

    next();
});

exports.aliasTopTours = async (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // const queryObj = { ...req.query };
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];

//     // excludedFields.forEach((el) => delete queryObj[el]);

//     // console.log(req.query, queryObj);

//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(
//     //     /\b(gte|gt|lte|lt)\b/g,
//     //     (match) => `$${match}`
//     // );

//     // let query = Tour.find(JSON.parse(queryStr));
//     // {difficulty: 'easy}, duration: {$gte: 5}

//     // const tours = await Tour.find()
//     //     .where('duration')
//     //     .equals(5)
//     //     .where('difficulty')
//     //     .equals('easy');

//     // if (req.query.sort) {
//     //     const sortBy = req.query.sort.split(',').join(' ');
//     //     query = query.sort(sortBy);
//     //     // sort('price ratingsAverage')
//     // } else {
//     //     query = query.sort('-createdAt');
//     // }

//     // if (req.query.fields) {
//     //     const fields = req.query.fields.split(',').join(' ');
//     //     query = query.select(fields);
//     // } else {
//     //     query = query.select('-__v');
//     // }

//     // const page = req.query.page * 1 || 1;
//     // const limit = req.query.limit * 1 || 100;
//     // const skip = (page - 1) * limit;
//     // query = query.skip(skip).limit(limit);

//     // if (req.query.page) {
//     //     const numTours = await Tour.countDocuments();
//     //     console.log(numTours);
//     //     if (skip >= numTours) throw new Error('Page unavailable');
//     // }

//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();
//     // const tours = await query;
//     const tours = await features.query;

//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours,
//         },
//     });

//     // try {

//     // } catch (error) {
//     //     console.error(error);
//     //     res.status(500).json({
//     //         status: 'failure',
//     //         message: error,
//     //     });
//     // }
// });

exports.getTour = factory.getOne(Tour, {
    path: 'reviews',
});
// exports.getTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews');

//     if (!tour) {
//         return next(new AppError('Not found with that id', 404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour,
//         },
//     });

//     // try {

//     // } catch (error) {
//     //     res.status(500).json({
//     //         status: 'failure',
//     //         message: error,
//     //     });
//     // }
// });

// const catchAsync = (fn) => {
//     return (req, res, next) => {
//         fn(req, res, next).catch((err) => next(err));
//     };
// };

exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour,
//         },
//     });

//     // try {
//     //     const newTour = await Tour.create(req.body);

//     //     res.status(201).json({
//     //         status: 'success',
//     //         data: {
//     //             tour: newTour,
//     //         },
//     //     });
//     // } catch (error) {
//     //     res.status(500).json({
//     //         status: 'failure',
//     //         message: error,
//     //     });
//     // }
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true,
//     });

//     if (!tour) {
//         return next(new AppError('Not found with that id', 404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour,
//         },
//     });

//     // try {

//     // } catch (error) {
//     //     res.status(500).json({
//     //         status: 'failure',
//     //         message: error,
//     //     });
//     // }
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         return next(new AppError('Not found with that id', 404));
//     }

//     res.status(204).json({
//         status: 'success',
//         data: null,
//     });

//     // try {

//     // } catch (error) {
//     //     res.status(500).json({
//     //         status: 'failure',
//     //         message: error,
//     //     });
//     // }
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {
                ratingsAverage: {
                    $gte: 4.5,
                },
            },
        },
        {
            $group: {
                // _id: '$ratingsAverage',
                // _id: '$difficulty',
                _id: {
                    $toUpper: '$difficulty',
                },
                numTours: {
                    $sum: 1,
                },
                numRatings: {
                    $sum: '$ratingsQuantity',
                },
                avgRating: {
                    $avg: '$ratingsAverage',
                },
                avgPrice: {
                    $avg: '$price',
                },
                minPrice: {
                    $min: '$price',
                },
                maxPrice: {
                    $max: '$price',
                },
            },
        },
        {
            $sort: {
                avgPrice: 1,
            },
        },
        // {
        //     $match: {
        //         _id: {
        //             $ne: 'EASY',
        //         },
        //     },
        // },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });

    // try {

    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({
    //         status: 'failure',
    //         message: error,
    //     });
    // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: {
                    $month: '$startDates',
                },
                numTourStarts: {
                    $sum: 1,
                },
                tours: {
                    $push: '$name',
                },
            },
        },
        {
            $addFields: {
                month: '$_id',
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
        {
            $sort: {
                numTourStarts: -1,
            },
        },
        {
            $limit: 6,
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan,
        },
    });

    // try {

    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({
    //         status: 'failure',
    //         message: error,
    //     });
    // }
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        return next(new AppError('Please provide in correct format', 400));
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius],
            },
        },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        return next(new AppError('Please provide in correct format', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1],
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances,
        },
    });
});
