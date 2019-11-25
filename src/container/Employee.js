import React, { Component } from 'react'; 
import { Form, FormGroup,FormFeedback, Label, Input ,Button} from 'reactstrap';
import '../index.css';
import axios from '../axios-dynamo';
import DatePicker from "react-datepicker"; 
import "react-datepicker/dist/react-datepicker.css";
import {header,button} from './constants';
import queryString from 'query-string'

class Employee extends Component {

  constructor(props) {
    super(props);

    this.state = {
      action:'',
      readForm:false,
      readOnlyField:false,
      hidEmployeeId:'',
      employeeId:'',
      employeeIdError:'',
      genderMaleChk:false,
      genderFemaleChk:false,      
      formField: { firstName: '', surName: '', email: '', gender: '' ,dateOfBirth:null},
      formErrors: { firstName: '', surName: '', email: '', gender: '' ,dateOfBirth:''},
      formFieldValid : { firstName: false, surName: false, email: false, gender: false ,dateOfBirth:false},
      formValid: false,
      frValid: false,
      formResult:''
    };
  }

  componentDidMount () {       
    this.loadData();
  }

  componentDidUpdate () {
    this.loadData();
  }

  loadData () {
      const values = queryString.parse(this.props.location.search)
      const action = values.action;
      let {readForm,readOnlyField} = false;
      //console.log(action)
      if('create' !== action)
      {
          readForm = true;
      }
      if('read' === action || 'delete' === action)
      {
          readOnlyField = true;
      }

      // to avoid infinite loop
      if(action)
      {
        if(!this.state.action || this.state.action !== action)
        {
          this.defaultAllStateValues();
          this.setState({action,readForm,readOnlyField})
        }
      }
  } 

  //state mangement functions
  //default All State other than Action
  defaultAllStateValues()    {
    this.setState(
      {        
        readForm:false,
        readOnlyField:false,
        hidEmployeeId:'',
        employeeId:'',
        employeeIdError:'',
        genderMaleChk:false,
        genderFemaleChk:false,      
        formField: { firstName: '', surName: '', email: '', gender: '' ,dateOfBirth:null},
        formErrors: { firstName: '', surName: '', email: '', gender: '' ,dateOfBirth:''},
        formFieldValid : { firstName: false, surName: false, email: false, gender: false ,dateOfBirth:false},
        formValid: false,
        frValid: false,
        formResult:''
      })
  }

  //defaulting formField State Values
  defaultFormFieldStates()    {
      this.setState({hidEmployeeId:'',//employeeId:'', 
      formField:{firstName:'',surName:'',email:'',gender:'',dateOfBirth:null},genderMaleChk:false,
      formErrors: { firstName: '', surName: '', email: '', gender: '' ,dateOfBirth:''},
      formFieldValid : { firstName: false, surName: false, email: false, gender: false ,dateOfBirth:false},
      genderFemaleChk:false,formResult:''})
  }

    //handleRadioButtonState
    handleGenderState(value)
    {
      if('M' === value)
          this.setState({ genderMaleChk:true,genderFemaleChk:false});
      if('F' === value)
          this.setState({ genderFemaleChk:true,genderMaleChk:false});
    }

  //utility function
  checkEmployeeIdInput(value)
  {
    let isValid  = true;   
    const pattern = /^\d+$/;
    isValid = pattern.test(value)  
    let msg = '';
    if(!isValid)
    {      
      msg =  'EmployeeNumber should be  numeric' 
    }      
    this.setState( { employeeIdValid: isValid } );
    this.setState( { employeeIdError: msg } );
    return isValid;
  }

  //utility function
  checkAlphabet(value)
  {
    let isValid  = true;   
    const pattern = /^[A-Za-z]+$/;
    isValid = pattern.test(value)  
    return isValid;
  }



  //utility function
  deduct_years(dt,n)  {
    return new Date(dt.setFullYear(dt.getFullYear() - n));      
  }

  emailDomainCheck(email, domain)
  {
      var parts = email.split('@');
      if (parts.length === 2) {
          if (parts[1] === domain) {
              return true;
          }
      }
      return false;
  }

   //validate Read Record and set state
   handleReadInput(e) {
    this.defaultFormFieldStates();
    const name = e.target.name;
    const value = e.target.value.trim();
    this.setState({ [name]: value });
    this.checkEmployeeIdInput(value);  
  }
  
  //validate form Field and set state
  handleUserInput(e) {
    const name = e.target.name;
    const value = e.target.value.trim();
    let formField = {...this.state.formField};
    formField[name] = value;
    this.setState({formField },
        () => { this.validateField(name, value) });
    if('gender' === name)
    {
        this.handleGenderState(value)
    }
    this.setState( { frValid: false } );
    this.setState( { formResult: '' } );
  }
  
  //validate date and set state
  handleDate =  dateOfBirth => {
    let formField = {...this.state.formField}
    formField.dateOfBirth = dateOfBirth;
    this.setState({formField})
    this.setState({
      formField},  this.validateField('dateOfBirth', dateOfBirth));
    this.setState( { frValid: false } );
    this.setState( { formResult: '' } );
   }
   
  
  
  //handling employeeId validation and state
  formHandler = async ( event ) => {
    event.preventDefault();    
    const employeeId = this.state.employeeId;
    this.defaultFormFieldStates();
    if(!this.checkEmployeeIdInput(this.state.employeeId))
    {
      return;
    }
     
    axios.get( '/employees/'+ employeeId )
    .then( response => {        
        //console.log("response",response)
        const item = response.data.Item;
        if(!item)
        {
            this.defaultFormFieldStates();
            this.setState( { frValid: true } );
            this.setState( { formResult: 'EmployeeNumber is not valid' } );
            this.setState({employeeId:employeeId});
            return;
        }
        let formField = {...item}
        formField.dateOfBirth = new Date(item.dateOfBirth)
        this.setState({hidEmployeeId:employeeId, formField})
        this.handleGenderState(item.gender)     
        this.setState( { frValid: false,formResult:'' } );   
        this.setState({formValid:true})
    } )
    .catch( error => {
          console.log("error",error)      
        this.setState( { frValid: true } );
        this.setState( { formResult: error.message } );
    } );
  }  

   //handling form Field validation  state and API Calls for CREATE,POST,DELETE
  submitHandler =  async ( event ) => {
      event.preventDefault();      
      const employeeId = this.state.employeeId;
      //check if the data exists for update and delete
      if('update' === this.state.action || 'delete' === this.state.action)
      {
        if( !this.state.employeeId || (this.state.employeeId !== this.state.hidEmployeeId) )
        {
                this.setState( { frValid: true } );
                this.setState( { formResult: ' Please retrieve Employee Details before Action ' } );
                return;
        }  
      } 

      //validate all fields for create and update
      if('create' === this.state.action || 'update' === this.state.action)
      {
      
        await this.validateNonCheckedFields();
      }
      //console.log('this.state.formValid'+this.state.formValid)
      if(!this.state.formValid)
      {
        this.setState( { frValid: true } );
        this.setState( { formResult: 'Please Fix the Data Entry Errors' } );
        return;
      }
      const employeeData = { ...this.state.formField};
      if('create' ===this.state.action)
      {
          axios.post( '/employees', employeeData )
          .then( response => {             
              //console.log("response",response)
              this.setState( { frValid: true } );
              this.setState( { formResult: 'Employee Succesfully Created with Id '+response.data.EmployeeNumber } );
          } )
          .catch( error => {
              let formResult = this.getErrorMessage(error);
              this.setState( { frValid: true } );
              this.setState( { formResult: formResult } );
          } );
      }
      else  if('update' ===this.state.action)
      {
          axios.patch( '/employees/'+ employeeId , employeeData )
              .then( response => {                 
                  //console.log("response",response)  
                  this.setState( { frValid: true } );
                  this.setState( { formResult: 'Employee Id ' +employeeId + ' Succesfully Updated'} );
          } )
          .catch( error => {
              let formResult = this.getErrorMessage(error);
              this.setState( { frValid: true } );
              this.setState( { formResult: formResult} );
          } );
      }
      else  if('delete' ===this.state.action)
      {
          axios.delete( '/employees/'+ employeeId )
              .then( response => {                 
                  //console.log("response",response)                
                  this.setState( { frValid: true } );
                  this.setState( { formResult: 'Employee Id ' +employeeId + ' Succesfully Deleted'} );
          } )
          .catch( error => {
              //console.log("error",error)
              let formResult = this.getErrorMessage(error);             
              this.setState( { frValid: true } );
              this.setState( { formResult: formResult} );
          } );
      }
  }  

  //utility function to customize error
  getErrorMessage(error)
  {
        //console.log("error",error)
        let formResult = '';
        if(error.response)
        {
        formResult = error.response.data.error;
        }
        else
        {
        formResult = error.message;
        }
        return formResult
  }
  
  //utility function to call validation of all form field to be called in submit
  validateNonCheckedFields = () => {
      this.validateField('firstName', this.state.formField.firstName)
      this.validateField('surName', this.state.formField.surName)
      this.validateField('email', this.state.formField.email)
      this.validateField('gender', this.state.formField.gender)
      this.validateField('dateOfBirth', this.state.formField.dateOfBirth)
  }

  //validation function  for form field
  validateField(fieldName, value) {
  let fieldValidationErrors = this.state.formErrors;
  let formFieldValid = this.state.formFieldValid;
  //console.log("validationfiled ", fieldName,this.state)

  switch (fieldName) {
      case 'firstName':
          formFieldValid[fieldName] =  value.length >= 3;
          fieldValidationErrors.firstName = formFieldValid[fieldName] ? '' :
          value === 0 ? 'FirstName is Mandatory':
          'FirstName is too short';
          if( formFieldValid[fieldName])
          {
            formFieldValid[fieldName] =  this.checkAlphabet(value);
            fieldValidationErrors[fieldName] =   formFieldValid[fieldName] ? '' : 
            'First Name Should  have alphabets only'
          }
          break;
      case 'surName':
        formFieldValid[fieldName] = value.length >= 5;
        fieldValidationErrors.surName = formFieldValid[fieldName] ? '' : 
        value === 0 ? 'SurName is Mandatory': 
        'SurName is too short';
        if( formFieldValid[fieldName])
        {
          formFieldValid[fieldName] = this.checkAlphabet(value);
          fieldValidationErrors[fieldName] =   formFieldValid[fieldName] ? '' : 
          'SurName Should not alphabets only'
        }
        break;
      case 'email':
          let emailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
          if(emailValid !== null) 
          {
            emailValid =true;
            emailValid = this.emailDomainCheck(value, 'zyllu.com')
            fieldValidationErrors[fieldName] = emailValid ? '' : ' Email Id Should be for zyllu domain';
            
          }
          else
           emailValid =false;
           formFieldValid[fieldName] = emailValid;
           if(!fieldValidationErrors[fieldName])
              fieldValidationErrors[fieldName] = emailValid ? '' : ' Email Id is invalid';
          break;
      case 'gender':
        formFieldValid[fieldName] = value.length >= 1;
        fieldValidationErrors[fieldName] = formFieldValid[fieldName] ? '' : 'Gender is Mandatory';
        break;    
      case 'dateOfBirth':
        formFieldValid[fieldName] =   value!== null ;
        fieldValidationErrors[fieldName] = formFieldValid[fieldName] ? '' : 'Date Of Birth is Mandatory';
        break;    
     
      default:
          break;
      
  }   
  //console.log("fieldValidationErrors ", fieldValidationErrors)
  this.setState({
      formErrors: fieldValidationErrors,
      formFieldValid: formFieldValid}, this.validateForm);
 }

 //utility and State function to validate formValid field
 validateForm() {
    this.setState({ formValid:  this.state.formFieldValid.firstName &&  this.state.formFieldValid.surName &&
    this.state.formFieldValid.email && this.state.formFieldValid.gender && this.state.formFieldValid.dateOfBirth});
  }

  

  render()   {
    let readForm = '';
    //render the employeeReadForm conditionally
    if(this.state.readForm)
    {
        readForm = 
        <Form className='form-outer' onSubmit={this.formHandler}>
        <FormGroup>
            <Label for="employeeId" className='label2' >Employee ID</Label>
            <Input type="text" name="employeeId" id="employeeId" placeholder="Employee Id"
            onChange ={(event) => this.handleReadInput(event)} value={this.state.employeeId}
            invalid={!this.state.employeeIdValid} />
            <FormFeedback  className="feedback" valid={this.state.employeeIdValid}  >{this.state.employeeIdError}   </FormFeedback>
        </FormGroup>
        <FormGroup>
            <Label></Label>
            <Button className="button button2">Read</Button>
      </FormGroup>
      </Form>;
    }
    //render the FormSubmit Button conditionally
    let buttonForm = '';
    if('read' !== this.state.action)
    {
      buttonForm = <FormGroup>
      <Label ></Label>     
        <button className="button button2">{button[this.state.action]}</button>
        </FormGroup> 
    }
    let actionForm = '';
    let formHeader = '';
    if(this.state.action)
    {
      formHeader = 
      <div>
      <br/><br/>
      <p  className="var3"> {header[this.state.action]}</p>
      <hr className="new2" ></hr></div>

      actionForm =
      <Form className='form-wrapper' onSubmit={this.submitHandler} noValidate>      
        <FormGroup>
          <Label for="firstName">First Name</Label>
          <Input type="text" name="firstName" id="firstName" placeholder="First Name"
           maxLength={40} onChange ={(event) => this.handleUserInput(event)} 
           value={this.state.formField.firstName}  readOnly={this.state.readOnlyField}
           invalid={!this.state.formFieldValid.firstName} />
          <FormFeedback  className="feedback" valid={this.state.formFieldValid.firstName}  >{this.state.formErrors.firstName}   </FormFeedback>
        </FormGroup>
        <FormGroup>
          <Label for="surName">Sur Name</Label>
          <Input type="text" name="surName" id="surName" placeholder="Sur Name" 
           maxLength={40} onChange={(event) => this.handleUserInput(event)} 
           value={this.state.formField.surName}  readOnly={this.state.readOnlyField}
           invalid={!this.state.formFieldValid.surName} />
           <FormFeedback  className="feedback" valid={this.state.formFieldValid.surName}  >{this.state.formErrors.surName}   </FormFeedback>
        </FormGroup>
        <FormGroup>
          <Label for="email">Email</Label>
          <Input type="email" name="email" id="email" placeholder="email"  noValidate
            maxLength={100} onChange={(event) => this.handleUserInput(event)} 
            value={this.state.formField.email}  readOnly={this.state.readOnlyField} />
          <FormFeedback  className="feedback" valid={this.state.formFieldValid.email}  >{this.state.formErrors.email}   </FormFeedback>
        </FormGroup>
        <FormGroup>            
              <Label for="dateOfBirth">Date of Birth </Label>
              <DatePicker
                selected={this.state.formField.dateOfBirth}
                onChange={this.handleDate}
                maxDate={this.deduct_years(new Date(),18)}
                peekNextMonth
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"      
                readOnly={this.state.readOnlyField}         
              />
              <FormFeedback  className="feedback" valid={this.state.formFieldValid.dateOfBirth}  >{this.state.formErrors.dateOfBirth}   </FormFeedback>             
        </FormGroup>    
        <FormGroup>
          <Label >Gender</Label>
        <FormGroup tag="fieldset">
            <Label className='label2'>
              <Input type="radio" name="gender"    onChange={(event) => this.handleUserInput(event)} 
              checked={this.state.genderMaleChk}   disabled={this.state.readOnlyField}     
              value="M"/>{''}
              Male
            </Label>
            <Label className='label2'>
              <Input type="radio" name="gender"   onChange={(event) => this.handleUserInput(event)}  
              checked={this.state.genderFemaleChk}   disabled={this.state.readOnlyField}     
              value="F"/>{''}
              Female
            </Label>
            </FormGroup>
            <FormFeedback  className="feedback" valid={this.state.formFieldValid.gender}  >{this.state.formErrors.gender}   </FormFeedback>
          </FormGroup>
          <FormGroup>
          <FormFeedback  className="feedback" valid={this.state.frValid}  >{this.state.formResult}   </FormFeedback>  
          </FormGroup>
          {buttonForm}
      </Form>    
    }
    return (
      <div>
      {formHeader}
      {readForm}
      {actionForm}
      </div>
    );
  }
}

export default Employee;