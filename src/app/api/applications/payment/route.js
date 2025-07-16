import { NextResponse } from 'next/server';
import { supabaseAdmin } from "../../../../../backend/config/database";


// Utility function to parse amount from various formats
const parseAmount = (amount) => {
  if (typeof amount === 'number') {
    return amount;
  }
  
  if (typeof amount === 'string') {
    // Remove currency symbols, commas, and spaces
    const cleanAmount = amount
      .replace(/[^\d.-]/g, '') // Remove everything except digits, dots, and hyphens
      .trim();
    
    const parsed = parseFloat(cleanAmount);
    
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error('Invalid amount format');
    }
    
    return Math.round(parsed); // Ensure it's an integer for currency in smallest unit
  }
  
  throw new Error('Amount must be a number or string');
};



// Mock payment processing functions
const processCardPayment = async (paymentData) => {
  console.log('Processing card payment:', { applicationId: paymentData.applicationId, amount: paymentData.amount });
  
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock payment validation
  const { cardNumber, expiryDate, cvv, cardholderName } = paymentData.details;
  
  // Basic validation
  if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
    console.error('Card payment validation failed - missing details');
    throw new Error('Invalid card details');
  }
  
  // Mock declined cards (for testing)
  const declinedCards = ['4000000000000002', '4000000000000069'];
  const cleanCardNumber = cardNumber.replace(/\s/g, '');
  
  if (declinedCards.includes(cleanCardNumber)) {
    console.error('Card declined:', cleanCardNumber);
    throw new Error('Card declined by bank');
  }
  
  // Mock successful payment
  const result = {
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    providerTransactionId: `VISA_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    status: 'completed',
    amount: paymentData.amount,
    method: 'card',
    provider: 'Visa',
    processingFee: Math.round(paymentData.amount * 0.029), // 2.9% processing fee
    timestamp: new Date().toISOString(),
  };
  
  console.log('Card payment successful:', result);
  return result;
};

const processMobilePayment = async (paymentData) => {
  console.log('Processing mobile payment:', { applicationId: paymentData.applicationId, amount: paymentData.amount });
  
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { phoneNumber, pin } = paymentData.details;
  
  // Basic validation
  if (!phoneNumber || !pin) {
    console.error('Mobile payment validation failed - missing details');
    throw new Error('Invalid mobile payment details');
  }
  
  // Mock insufficient balance
  if (pin === '0000') {
    console.error('Mobile payment failed - insufficient balance');
    throw new Error('Insufficient balance in mobile money account');
  }
  
  // Mock successful payment
  const result = {
    transactionId: `MOB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    providerTransactionId: `MTN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    status: 'completed',
    amount: paymentData.amount,
    method: 'mobile',
    provider: 'MTN Mobile Money',
    processingFee: 100, // 100 FBU processing fee
    timestamp: new Date().toISOString(),
  };
  
  console.log('Mobile payment successful:', result);
  return result;
};

const processBankTransfer = async (paymentData) => {
  console.log('Processing bank transfer:', { applicationId: paymentData.applicationId, amount: paymentData.amount });
  
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { accountNumber, bankName, accountHolder } = paymentData.details;
  
  // Basic validation
  if (!accountNumber || !bankName || !accountHolder) {
    console.error('Bank transfer validation failed - missing details');
    throw new Error('Invalid bank transfer details');
  }
  
  // Mock account validation
  if (accountNumber === '0000000000') {
    console.error('Bank transfer failed - invalid account number');
    throw new Error('Invalid account number');
  }
  
  // Mock successful payment
  const result = {
    transactionId: `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    providerTransactionId: `${bankName.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    status: 'completed',
    amount: paymentData.amount,
    method: 'bank',
    provider: bankName,
    processingFee: 0,
    timestamp: new Date().toISOString(),
  };
  
  console.log('Bank transfer successful:', result);
  return result;
};

const savePaymentRecord = async (paymentData, paymentResult) => {
  console.log('Saving payment record to database...');
  
  try {
    // Calculate due date (30 days from now for example)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Prepare payment record data
    const paymentRecord = {
      application_id: paymentData.applicationId,
      payment_info: {
        details: paymentData.details,
        original_amount: paymentData.amount,
        processing_info: {
          processed_at: paymentResult.timestamp,
          method: paymentResult.method,
          provider: paymentResult.provider
        }
      },
      status: paymentResult.status,
      transaction_id: paymentResult.transactionId,
      amount: paymentData.amount,
      currency: 'FBU',
      method: paymentResult.method,
      processing_fee: paymentResult.processingFee,
      provider: paymentResult.provider,
      provider_transaction_id: paymentResult.providerTransactionId,
      payment_date: paymentResult.timestamp,
      due_date: dueDate.toISOString(),
      failure_reason: null,
      receipt_url: null, // Could be generated/stored later
      refund_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('Payment record data:', paymentRecord);
    
    // Insert payment record
    const { data: savedPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();
    
    if (paymentError) {
      console.error('Payment record insertion error:', paymentError);
      throw new Error('Failed to save payment record: ' + paymentError.message);
    }
    
    console.log('Payment record saved successfully:', savedPayment);
    return savedPayment;
    
  } catch (error) {
    console.error('Save payment record error:', error);
    throw error;
  }
};


export async function POST(request) {
  console.log('=== Payment Processing Started ===');
  
  try {
    // Parse request body
    const rawPaymentData = await request.json();
    console.log('Raw payment data received:', rawPaymentData);
    
    // Parse and validate amount
    let parsedAmount;
    try {
      parsedAmount = parseAmount(rawPaymentData.amount);
      console.log('Amount parsed successfully:', { original: rawPaymentData.amount, parsed: parsedAmount });
    } catch (amountError) {
      console.error('Amount parsing failed:', amountError);
      return NextResponse.json(
        { success: false, error: 'Invalid amount format: ' + amountError.message },
        { status: 400 }
      );
    }
    
    // Create payment data object with parsed amount
    const paymentData = {
      ...rawPaymentData,
      amount: parsedAmount
    };
    
    console.log('Processed payment data:', {
      applicationId: paymentData.applicationId,
      amount: paymentData.amount,
      method: paymentData.method,
      hasDetails: !!paymentData.details
    });
    
    // Validate required fields
    if (!paymentData.applicationId || !paymentData.amount || !paymentData.method) {
      console.error('Missing required payment information:', {
        applicationId: !!paymentData.applicationId,
        amount: !!paymentData.amount,
        method: !!paymentData.method
      });
      return NextResponse.json(
        { success: false, error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Validate payment details based on method
    if (!paymentData.details || typeof paymentData.details !== 'object') {
      console.error('Invalid payment details:', paymentData.details);
      return NextResponse.json(
        { success: false, error: 'Invalid payment details' },
        { status: 400 }
      );
    }

    let paymentResult;
    
    // Process payment based on method
    try {
      console.log('Processing payment with method:', paymentData.method);
      
      switch (paymentData.method) {
        case 'card':
          paymentResult = await processCardPayment(paymentData);
          break;
        case 'mobile':
          paymentResult = await processMobilePayment(paymentData);
          break;
        case 'bank':
          paymentResult = await processBankTransfer(paymentData);
          break;
        default:
          console.error('Invalid payment method:', paymentData.method);
          return NextResponse.json(
            { success: false, error: 'Invalid payment method' },
            { status: 400 }
          );
      }
    } catch (paymentError) {
      console.error('Payment processing failed:', paymentError);
      
      // Save failed payment record
      try {
        const failedPaymentRecord = {
          application_id: paymentData.applicationId,
          payment_info: {
            details: paymentData.details,
            original_amount: paymentData.amount,
            error_info: {
              error_message: paymentError.message,
              failed_at: new Date().toISOString(),
              method: paymentData.method
            }
          },
          status: 'failed',
          transaction_id: `FAILED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: paymentData.amount,
          currency: 'FBU',
          method: paymentData.method,
          processing_fee: 0,
          provider: null,
          provider_transaction_id: null,
          payment_date: null,
          due_date: null,
          failure_reason: paymentError.message,
          receipt_url: null,
          refund_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        await supabaseAdmin.from('payments').insert(failedPaymentRecord);
        console.log('Failed payment record saved');
      } catch (dbError) {
        console.error('Failed to save failed payment record:', dbError);
      }
      
      return NextResponse.json(
        { success: false, error: paymentError.message },
        { status: 400 }
      );
    }

    // Save payment record and update application status
    try {
      console.log('Saving payment record...');
      
      // Save payment record to database
      const savedPayment = await savePaymentRecord(paymentData, paymentResult);
      
      console.log('=== Payment Processing Completed Successfully ===');
      
      return NextResponse.json({
        success: true,
        transactionId: paymentResult.transactionId,
        amount: paymentResult.amount,
        currency: 'FBU',
        method: paymentResult.method,
        provider: paymentResult.provider,
        processingFee: paymentResult.processingFee,
        status: paymentResult.status,
        timestamp: paymentResult.timestamp,
        paymentRecord: savedPayment
      });
      
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save payment record: ' + dbError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('=== Payment Processing Error ===', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}