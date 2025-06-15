import api from './api';

const getAllCustomers = async () => {
  try {
    const response = await api.get('/customers');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

const getCustomerById = async (id: string) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

const createCustomer = async (customerData: any) => {
  try {
    const response = await api.post('/customers', customerData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

const updateCustomer = async (id: string, customerData: any) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

const deleteCustomer = async (id: string) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

const customerService = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

export default customerService;
