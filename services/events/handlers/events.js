const cars = require("../../../pkg/cars");
const { CarPOST, CarPUT, validate } = require("../../../pkg/cars/validate");


const getVehicle = async (req, res) => {
    try {
        const allCars = await cars.get();
        return res.status(200).send(allCars);
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error!");
    }
};

const createVehicle = async (req, res) => {
    console.log(req.body)
    try {
        // await validate(req.body, CarPOST);
        await cars.create(req.body);
        return res.status(200).send("Vehicle created successfully!");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error!");
    }
};

const updateVehicle = async (req, res) => {
    try {
        await validate(req.body, CarPUT);
        await cars.update(req.params.id, req.body);
        return res.status(200).send("Vehicle updated successfully!");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error!");
    }
};

const removeVehicle = async (req, res) => {
    try {
        await cars.remove(req.params.id);
        return res.status(200).send("Vehicle removed successfully!");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error!");
    }
};

module.exports = {
    getVehicle,
    createVehicle,
    updateVehicle,
    removeVehicle,
};