import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  ArrowLeft, 
  Calendar, 
  Building2, 
  FileText, 
  Plus, 
  Trash2, 
  DollarSign,
  Package
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
}

interface InvoiceItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

interface InvoiceFormData {
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  notes: string;
  items: InvoiceItem[];
}

const InvoiceFormPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      client_id: '',
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      items: [
        {
          id: uuidv4(),
          product_id: '',
          quantity: 1,
          price: 0
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');

  useEffect(() => {
    const fetchBusinessId = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching business ID:', error);
        return;
      }

      if (data) {
        setBusinessId(data.id);
      }
    };

    fetchBusinessId();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) return;

      setIsLoading(true);
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .eq('business_id', businessId)
          .order('name');

        if (clientsError) throw clientsError;
        
        setClients(clientsData || []);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, type')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .order('name');

        if (productsError) throw productsError;
        
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  useEffect(() => {
    // Calculate total amount whenever items change
    const total = watchItems.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    setTotalAmount(total);
  }, [watchItems]);

  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setValue(`items.${index}.price`, selectedProduct.price);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!businessId) {
      toast.error('Business ID not found');
      return;
    }

    if (data.items.length === 0 || data.items.some(item => !item.product_id)) {
      toast.error('Please add at least one product to the invoice');
      return;
    }

    setIsSaving(true);
    try {
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          business_id: businessId,
          client_id: data.client_id,
          invoice_number: data.invoice_number,
          issue_date: data.issue_date,
          due_date: data.due_date,
          status: 'unpaid',
          total_amount: totalAmount,
          notes: data.notes,
        })
        .select('id')
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = data.items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success('Invoice created successfully');
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/invoices"
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Invoice
          </h1>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
                Invoice Number
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="invoice_number"
                  {...register('invoice_number', { required: 'Invoice number is required' })}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.invoice_number ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm`}
                />
              </div>
              {errors.invoice_number && (
                <p className="mt-2 text-sm text-red-600">{errors.invoice_number.message}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="client_id"
                  {...register('client_id', { required: 'Client is required' })}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.client_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm`}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              {errors.client_id && (
                <p className="mt-2 text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
                Issue Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="issue_date"
                  {...register('issue_date', { required: 'Issue date is required' })}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.issue_date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm`}
                />
              </div>
              {errors.issue_date && (
                <p className="mt-2 text-sm text-red-600">{errors.issue_date.message}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="due_date"
                  {...register('due_date', { required: 'Due date is required' })}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.due_date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm`}
                />
              </div>
              {errors.due_date && (
                <p className="mt-2 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
            <div className="mt-4 border-t border-b border-gray-200">
              <div className="flex py-3 text-sm font-medium text-gray-500">
                <div className="w-5/12 px-2">Product/Service</div>
                <div className="w-2/12 px-2">Quantity</div>
                <div className="w-2/12 px-2">Price</div>
                <div className="w-2/12 px-2">Total</div>
                <div className="w-1/12 px-2"></div>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex py-2 items-center border-t border-gray-100">
                  <div className="w-5/12 px-2">
                    <select
                      {...register(`items.${index}.product_id` as const, { 
                        required: 'Product is required' 
                      })}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (${product.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.product_id && (
                      <p className="mt-1 text-xs text-red-600">{errors.items[index]?.product_id?.message}</p>
                    )}
                  </div>
                  <div className="w-2/12 px-2">
                    <input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity` as const, {
                        required: 'Required',
                        min: { value: 1, message: 'Min 1' },
                        valueAsNumber: true
                      })}
                      className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="mt-1 text-xs text-red-600">{errors.items[index]?.quantity?.message}</p>
                    )}
                  </div>
                  <div className="w-2/12 px-2">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.price` as const, {
                          required: 'Required',
                          min: { value: 0, message: 'Min 0' },
                          valueAsNumber: true
                        })}
                        className="block w-full pl-8 py-2 pr-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                      />
                    </div>
                    {errors.items?.[index]?.price && (
                      <p className="mt-1 text-xs text-red-600">{errors.items[index]?.price?.message}</p>
                    )}
                  </div>
                  <div className="w-2/12 px-2">
                    <div className="text-sm font-medium">
                      ${((watchItems[index]?.quantity || 0) * (watchItems[index]?.price || 0)).toFixed(2)}
                    </div>
                  </div>
                  <div className="w-1/12 px-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => append({ id: uuidv4(), product_id: '', quantity: 1, price: 0 })}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <div className="mt-1">
                <textarea
                  id="notes"
                  rows={3}
                  {...register('notes')}
                  className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Additional notes for the client..."
                />
              </div>
            </div>
            
            <div className="sm:col-span-2">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-500">Subtotal:</span>
                  <span className="text-gray-900">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="mt-4 flex justify-between text-base">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-5">
            <Link
              to="/invoices"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Create Invoice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceFormPage;