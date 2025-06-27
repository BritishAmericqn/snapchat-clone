require('dotenv').config();
console.log('Environment Variable Test');
console.log('=======================');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log('Key length:', process.env.OPENAI_API_KEY.length);
  console.log('Starts with sk-:', process.env.OPENAI_API_KEY.startsWith('sk-'));
}
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined'); 