var AWS = require("aws-sdk");
require('../config/awsconfig.js')
var docClient = new AWS.DynamoDB.DocumentClient();
var table = "Employee";

// return addEmployeeImpl as Promise
const addEmployee =   (body ) =>
{
    debugger
     return new Promise((resolve, reject) => {
        addEmployeeImpl(body).then( result =>{
            //console.log("result",result)
            resolve(result)
        }).catch( e =>{
            //console.log("e",e)
            reject({error:e.message} )
        })
    })
}

// Add Employee function to do Validation, generation of Employee Id and insert employee
//The function is async . All AWS DynamoDB methods are awaited to synchronize 
const  addEmployeeImpl =   async (body ) =>
{
    const matchFound = await checkEmployee (body);
    //console.log("matchFound"+matchFound)
    if(matchFound)
        throw( new Error("Employee found with same First Name, SurName, Email ID and DateOfBirth")); 
    const dataId =  await getEmployeeIds();
    var id = 1;
    if(dataId)
    {
        id = dataId.MaxId+1;
    }
    await addEmployeeId(id);
    body.EmployeeNumber=id
    const data = await addEmployeeAws(body)
    const retData = {EmployeeNumber:id}
    return retData;
   
}

// Actual Employee Addition function to DynamoDB
const addEmployeeAws =   (body ) =>
{
     return new Promise((resolve, reject) => {        
        var params = {
            TableName:table,
            Item:{}          
        };
        params.Item = {...body}       
        //console.log("Adding a new item...", params.Item);    
        docClient.put(params,  function(err, data) {
            if(err)
                 reject(err); 
            resolve(data)
        });
    })
}

//  function to create/update EmployeeId Maxid
const addEmployeeId=   (id ) =>
{
     return new Promise((resolve, reject) => {        
        var params = {
            TableName:'EmployeeId',
            Item:{}          
        };
        params.Item = {Id:1,MaxId:id}       
        //console.log("Adding a new itemId...", params.Item);    
        docClient.put(params,  function(err, data) {
            if(err)
                 reject(err); 
            resolve(data)
        });
    })
}

//  function to retreive EmployeeId Maxid
const getEmployeeIds =  () =>
{
    return new Promise((resolve, reject) => {     
        var params = {
            TableName:'EmployeeId'   
        };
        //console.log("scanning Ids...");
        docClient.scan(params,  function(err, data) {
            //console.log("data from getEmployeeIds",data);
            if(err)
                return reject(err)
            resolve(data.Items[0])

        });
     })
}

//  function to check Employee with same firstName, surName, email and dateOfBirth
//This is not efficient way of checking the duplicate as it scans whole table
//This method is constructed to show some kind of data validation
const checkEmployee = (body,id ) =>
{
    return new Promise((resolve, reject) => {     
        var params = {
            TableName:'Employee'   
        };
        //console.log("scanning employees...");
        docClient.scan(params,  function(err, data) {
            if(err)
            {
                //console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                return reject(err)
            }
            else
            {
                var matchFound =  data.Items.some(function (employee) { 
                    var check = false;
                    if(id)
                    {
                       
                        check =  id != employee.EmployeeNumber && employee.firstName === body.firstName && employee.surName === body.surName 
                        && employee.email === body.email
                        && employee.dateOfBirth === body.dateOfBirth;
                    }
                    else
                    {
                        check =  employee.firstName === body.firstName && employee.surName === body.surName 
                        && employee.email === body.email
                        && employee.dateOfBirth === body.dateOfBirth; 
                    }
                    //console.log(" check for id",id , check )
                    return check;                   
                    });
                resolve(matchFound)
            }
        });
     })
}

//  function to getAllEmployees
const getEmployees = (body ) =>
{
    return new Promise((resolve, reject) => {           
        var params = {
            TableName:table   
        };
        //console.log("scanning item...");
        docClient.scan(params,  function(err, data) {
            if(err)
                return reject(err)
            resolve(data)
        });
    })
}

//  function to getSingleEmployee
const getEmployee = (id ) =>
{
    return new Promise((resolve, reject) => {
        if(!isNumeric(id))           
            return reject('Numbers must be non-negative')
        var params = {
            TableName:table,
            Key: {
                "EmployeeNumber": parseInt(id, 10)
                }
        };
        docClient.get(params,  function(err, data) {
            if(err)
                return reject(err)
            resolve(data)

        }); 
    });
    
}

// return updateEmployeeImpl as Promise
const updateEmployee =   (id,body ) =>
{
     return new Promise((resolve, reject) => {
        updateEmployeeImpl(id,body).then( result =>{
            //console.log("result",result)
            resolve(result)
        }).catch( e =>{
            reject({error:e.message} )
        })
    })
}

// Update Employee function to do Validation  and update employee
//The function is async . All AWS DynamoDB methods are awaited to synchronize 
const  updateEmployeeImpl =   async (id, body ) =>
{
    if(!isNumeric(id))
         throw( new Error('Not a Valid Input For API'));          
    if(body.firstName === undefined || body.surName === undefined|| body.dateOfBirth  === undefined 
        || body.email === undefined || body.gender === undefined)           
        throw( new Error('All Attributes need to be updated'));         
    if(!body.FirstName && !body.SurName && !body.email && !body.dateOfBirth && !body.Gender)
        throw( new Error('No Data to Update'));
    const itemData = await getEmployee (id);
    if(!itemData.Item)
        throw( new Error("Employee Details not found for update. Refresh Employee Details")); 
    const matchFound = await checkEmployee (body,id);
    //console.log("matchFound"+matchFound)
    if(matchFound)
        throw( new Error("Employee found with same First Name, SurName, Email ID and DateOfBirth")); 
     await updateEmployeeAws(id,body);
}

// Actual Employee Updation function to DynamoDB
const updateEmployeeAws = (id,body ) =>
{
    return new Promise((resolve, reject) => {
        var params = {
            TableName:table,
            Key: {
                "EmployeeNumber": parseInt(id, 10)
                },
            AttributeUpdates: {  
                'firstName': {Value :body.firstName},
                'surName': {Value :body.surName},
                'dateOfBirth': {Value : body.dateOfBirth},
                'email': {Value : body.email},
                'gender': {Value :body.gender}
            }
        }

        params.Item = {...body}
        //console.log("Updating the item...");       
        docClient.update(params,  function(err, data) {
            if(err)
                return reject(err)
            resolve(data)
        });
    });
}



// return deleteEmployeeImpl as Promise
const deleteEmployee =   (id ) =>
{
     return new Promise((resolve, reject) => {
        deleteEmployeeImpl(id).then( result =>{
            //console.log("result",result)
            resolve(result)
        }).catch( e =>{            
            reject({error:e.message} )
        })
    })
}

// Delete Employee function to do Validation  and update employee
//The function is async . All AWS DynamoDB methods are awaited to synchronize 
const  deleteEmployeeImpl =   async (id, ) =>
{
    if(!isNumeric(id))
        throw( new Error("Not a Valid Input For API")); 
    const itemData = await getEmployee (id);
    //console.log("item"+itemData.Item)
    if(!itemData.Item)
        throw( new Error("Employee Details not found for Delete. Refresh Employee Details")); 
     await deleteEmployeeAws(id);
}

// Actual Employee Deletion function to DynamoDB
const deleteEmployeeAws = (id ) =>
{
    return new Promise((resolve, reject) => {
  
        var params = {
            TableName:table,
            Key: {
                "EmployeeNumber": parseInt(id, 10)
                }
        };
        //console.log("Deleting item...");      
        docClient.delete(params,  function(err, data) {
            if(err)
                return reject(err)
            resolve(data)
        });
    });
}


function isNumeric(n) 
{
    return !isNaN(parseFloat(n)) && isFinite(n);
}


module.exports = {
    addEmployee: addEmployee,
    getEmployees: getEmployees,
    getEmployee:getEmployee,
    updateEmployee:updateEmployee,
    deleteEmployee:deleteEmployee
}

