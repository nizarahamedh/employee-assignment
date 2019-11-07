const express = require('express')
const router = new express.Router()
const employee = require('./awsemployee')  


router.post('/employees',  (req, res) =>
{
    employee.addEmployee(req.body ).then((data) => {
        res.send(data);
    }).catch((error) => {
        res.status(400).send(error);
    })
})

router.get('/employees',  (req, res) =>
{
    employee.getEmployees(req.body ).then((data) => {
        res.send(data);
    }).catch((error) => {
        res.status(400).send(error);
    })
})

router.get('/employees/:id',  (req, res) =>
{
    const _id = req.params.id;  
    employee.getEmployee(_id ).then((data) => {
        res.send(data);
    }).catch((error) => {
        res.status(400).send(error);
    })
})

router.patch('/employees/:id',  (req, res) =>
{
    const _id = req.params.id;  
    employee.updateEmployee(_id,req.body ).then((data) => {
        res.send(data);
    }).catch((error) => {
        //console.log("error ",error) 
        res.status(400).send(error);
    })
})


router.delete('/employees/:id',  (req, res) =>
{    
    const _id = req.params.id;  
    employee.deleteEmployee(_id ).then((data) => {
        res.send(data);
    }).catch((error) => {
        res.status(400).send(error);
    })
})

module.exports = router 