import { LightningElement,wire,api } from 'lwc';
import getParentAccounts from "@salesforce/apex/accountHelper.getParentAccounts";
import {getObjectInfo,getPicklistValues} from "lightning/uiObjectInfoApi";

import {createRecord,getRecord,getFieldValue,updateRecord,deleteRecord} from "lightning/uiRecordApi";
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
//import the object and their fields 
import ACCOUNT_OBJECT from "@salesforce/schema/Account";
import ACCOUNT_ID from "@salesforce/schema/Account.Id"
 import ACCOUNT_PARENT from "@salesforce/schema/Account.ParentId";
import ACCOUNT_NAME from "@salesforce/schema/Account.Name";
import ACCOUNT_SLA_EXPIRY_DATE from '@salesforce/schema/Account.SLAExpirationDate__c';
import ACCOUNT_NO_OF_LOCATIONS from '@salesforce/schema/Account.NumberofLocations__c';
import ACCOUNT_DESCRIPTION from '@salesforce/schema/Account.Description';
import ACCOUNT_SLA_TYPE from '@salesforce/schema/Account.SLA__c';
//import navigationMixin to navigate 
import { NavigationMixin } from 'lightning/navigation';

const fieldsToLoad = [ACCOUNT_PARENT,ACCOUNT_NAME,ACCOUNT_SLA_EXPIRY_DATE,ACCOUNT_SLA_TYPE,ACCOUNT_NO_OF_LOCATIONS,ACCOUNT_DESCRIPTION  ];


export default class WireCrudOPerations extends LightningElement {
  
  parentoptions = [];
  selParentAcc = "";
  selnoOfLocations ="1";
  selAccName ="";
  selExpDate ="";
  selSlatype= "";
  selDescription = "";
  @api recordId;

  //wire method to get an id of record to update the data
  @wire(getRecord,{
    recordId :"$recordId",
    fields: fieldsToLoad
  })
  wiredgetRecord_Function({data,error}){
    if(data){
      // this.parentoptions = data;
      console.log("Getting data************",data);
      this.selParentAcc = getFieldValue(data,ACCOUNT_PARENT);
      this.selnoOfLocations = getFieldValue(data,ACCOUNT_NO_OF_LOCATIONS);
      this.selAccName = getFieldValue(data,ACCOUNT_NAME)
      this.selExpDate = getFieldValue(data,ACCOUNT_SLA_EXPIRY_DATE)
      this.selSlatype = getFieldValue(data,ACCOUNT_SLA_TYPE)
      this.selDescription = getFieldValue(data,ACCOUNT_DESCRIPTION)

    }else if (error){
      console.error("Error Message during retrieving",error)
    }
  }

  // get parent accounts to fetch the accountNames and create an record
  @wire(getParentAccounts) wired_getParentAccount({data,error}){
    this.parentoptions =[]
    if(data){
     this.parentoptions =  data.map((curritem=>({
      label:curritem.Name,
      value:curritem.Id
     })))
    }else if(error){
      console.error("Error While Getting accounts",error)
    }
  }

  @wire(getObjectInfo,{
    objectApiName :ACCOUNT_OBJECT
  })
  accountobjectinfo;

  @wire(getPicklistValues,{
    recordTypeId: "$accountobjectinfo.data.defaultRecordTypeId",
    fieldApiName :ACCOUNT_SLA_TYPE
  })
  slapicklist;

  handleChange(event){
    let {name,value} =event.target;
    if(name == "parentacc" ){
     this.selParentAcc = value;
    }
    if(name == "accname" ){
     this.selAccName = value;
    }
    if(name == "slaexpdt" ){
     this.selExpDate = value;
    }
    if(name == "slatype" ){
     this.selSlatype = value;
    }
    if(name == "nooflocations" ){
     this.selnoOfLocations = value;
    }
    if(name == "description" ){
     this.selDescription = value;
    }
  }
// code for creating account
  saveRecord(){ 
    console.log('ACCOUNT_OBJECT',ACCOUNT_OBJECT)
    console.log('ACCOUNT_NAME',ACCOUNT_NAME)
    
    if(this.validateInput()){
      let inputfields={};
      inputfields[ACCOUNT_NAME.fieldApiName]= this.selAccName;
      inputfields[ACCOUNT_PARENT.fieldApiName]= this.selParentAcc;
      inputfields[ACCOUNT_SLA_TYPE.fieldApiName]= this.selSlatype;
      inputfields[ACCOUNT_SLA_EXPIRY_DATE.fieldApiName]= this.selExpDate;
      inputfields[ACCOUNT_NO_OF_LOCATIONS.fieldApiName]= this.selnoOfLocations;
      inputfields[ACCOUNT_DESCRIPTION.fieldApiName]= this.selDescription;
  
      if(this.recordId){
        //update record operation
        inputfields[ACCOUNT_ID.fieldApiName]= this.recordId;
        let recordInput ={
          fields:inputfields
        };
        updateRecord(recordInput).then((result)=>{
         console.log('Record Updated Successfully',result);
         this.showToast();
        }).catch((error)=>{
          console.error("Record Updation failed",error);
        })
      } else{
        let recordInput ={ 
     apiName:ACCOUNT_OBJECT.objectApiName,
     fields:inputfields
 }
      createRecord(recordInput).then(result=>{
     console.log('Account Created Successfully',result);
     let pageRef = {
      type:"standard__recordPage",
        attributes : {
                recordId: result.id,
                objectApiName: ACCOUNT_OBJECT.objectApiName,
                actionName: 'view'
            }
     };
     this[NavigationMixin.Navigate](pageRef);
      }).catch(error=>{
          console.error('Error occured',error)
      })

      }
    }else if(error){
      console.error('Inputs are not valid')
    }
  }
//code for validate the input fields 
  validateInput(){
   let fields= Array.from(this.template.querySelectorAll(".validateme"));
  let isValid = fields.every((curritem)=>curritem.checkValidity());
  return isValid;
  }
  
  
  get formTitle(){
    if(this.recordId){
      return 'Edit Account'
    }else {
      return 'Create Account'
    }
  }

  get isDeleteAvailable(){
    if(this.recordId){
      return true;
    }else {
      return false;
        }
  }

  showToast(){
    const event = new ShowToastEvent({
      title:"Success",
      message:"Record Updated Successfully"
    });
    this.dispatchEvent(event);
  }
  deleteHandler(){
   deleteRecord(this.recordId).then(()=>{
    console.log("Record Deleted Successfully");
    let pageRef={
      type:"standard__objectPage",
      atrributes:{
        objectApiName :"Account",
        actionName: "home"
      },
      state:{
         filterName :'MyAccounts'
      }
    };
    this[NavigationMixin.Navigate](pageRef);
   }).catch((error)=>{
    console.error("Record Deletion Failed",error )
   })
  }
}