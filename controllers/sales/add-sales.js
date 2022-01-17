


/***When adding sales, the product level should be decreasing */
const { HttpError } = require("../../middlewares/errors/http-error");
const joiError = require("../../middlewares/errors/joi-error");
const { httpResponse } = require("../../middlewares/http/http-response");
const { product } = require("../../model/products/products");
const { salesFieldValidation, Sales, } = require("../../model/sales/sales")

const addSales = async(req,res,next)=>{
    try {  
       const mSales = await salesFieldValidation.validateAsync(req.body); 
       const addNewSales = Sales.createSales(mSales);
    
       /****check if the purchased qty is not greater than the current qty */
       /***find product, deduct the qty from the current qty */
    
       mSales.items.forEach(async(item)=>{
        const mproduct = await product.findProductByBarcode(item.barcode);
        if (!mproduct) {
            const err= new HttpError(400, `No product is assigned to the provided barcode`);
            return next(err); 
           }
           if (item.quantity > mproduct.current_product_quantity) {
            const err= new HttpError(400, `The purchased quantity is greater than number of product in stock. You have ${mproduct.current_product_quantity} left in stock`);
            return next(err);
           }
    
            if (mproduct) {
                const data = {
                    current_product_quantity: mproduct.current_product_quantity -Number(item.quantity),
                    previous_product_quantity: mproduct.current_product_quantity
                }  
                const updateProduct = product.manageProductSales(mSales.product_barcode,data);
           }else{
            const err= new HttpError(500, 'Unable to add sales due to internal error, contact support');
            return next(err);
           }
       });
       
       addNewSales.save().then((s)=>{
        httpResponse({status_code:200, response_message:'Sales successfully added',data:s,res});
       }).catch((e)=>{
        const err= new HttpError(500, e.message);
        return next(err);
       });

      
     
    } catch (error) {
      joiError(error,next);  
    }
}

module.exports={
    addSales
}