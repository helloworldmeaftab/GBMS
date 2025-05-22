import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  Building2, 
  FileText, 
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

interface InvoiceItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    description: string | null;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  notes: string | null;
  clients: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
  };
  businesses: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  items: InvoiceItem[];
}

const InvoiceViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id || !user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            id, 
            invoice_number, 
            issue_date, 
            due_date, 
            status, 
            total_amount,
            notes,
            clients (
              name,
              email,
              phone,
              company,
              address
            ),
            businesses (
              name,
              email,
              phone,
              address
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        // Fetch invoice items
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            id,
            product_id,
            quantity,
            price,
            products (
              name,
              description
            )
          `)
          .eq('invoice_id', id);

        if (itemsError) throw itemsError;

        setInvoice({ ...data, items: itemsData || [] });
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id, user]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setInvoice(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    } finally {
      setIsUpdating(false);
    }
  };

  const generatePDF = () => {
    if (!invoice || !invoiceRef.current) return;

    const doc = new jsPDF();
    
    // Set up document
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 40);
    doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, 20, 50);
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 20, 60);
    
    // Business details
    doc.setFontSize(14);
    doc.text('From:', 20, 80);
    doc.setFontSize(12);
    doc.text(invoice.businesses.name, 20, 90);
    if (invoice.businesses.address) doc.text(invoice.businesses.address, 20, 100);
    if (invoice.businesses.email) doc.text(`Email: ${invoice.businesses.email}`, 20, 110);
    if (invoice.businesses.phone) doc.text(`Phone: ${invoice.businesses.phone}`, 20, 120);
    
    // Client details
    doc.setFontSize(14);
    doc.text('To:', 120, 80);
    doc.setFontSize(12);
    doc.text(invoice.clients.name, 120, 90);
    if (invoice.clients.company) doc.text(invoice.clients.company, 120, 100);
    if (invoice.clients.address) doc.text(invoice.clients.address, 120, 110);
    if (invoice.clients.email) doc.text(`Email: ${invoice.clients.email}`, 120, 120);
    if (invoice.clients.phone) doc.text(`Phone: ${invoice.clients.phone}`, 120, 130);
    
    // Invoice items
    doc.setFontSize(14);
    doc.text('Invoice Items', 20, 150);
    
    // Table header
    doc.setFontSize(10);
    doc.text('Item', 20, 160);
    doc.text('Quantity', 100, 160);
    doc.text('Price', 130, 160);
    doc.text('Total', 160, 160);
    
    doc.line(20, 165, 190, 165);
    
    // Table rows
    let y = 175;
    invoice.items.forEach((item) => {
      doc.text(item.products.name, 20, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(`$${item.price.toFixed(2)}`, 130, y);
      doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 160, y);
      y += 10;
    });
    
    doc.line(20, y, 190, y);
    y += 10;
    
    // Total
    doc.setFontSize(12);
    doc.text('Total:', 130, y);
    doc.text(`$${invoice.total_amount.toFixed(2)}`, 160, y);
    
    // Status
    y += 20;
    doc.setFontSize(14);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, y);
    
    // Notes
    if (invoice.notes) {
      y += 20;
      doc.setFontSize(14);
      doc.text('Notes:', 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(invoice.notes, 20, y);
    }
    
    // Save the PDF
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">Invoice not found</p>
        <Link
          to="/invoices"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Invoices
        </Link>
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
            Invoice #{invoice.invoice_number}
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Download className="h-5 w-5 mr-2" />
            Download PDF
          </button>
          {invoice.status === 'unpaid' && (
            <button
              onClick={() => handleStatusChange('paid')}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Mark as Paid
            </button>
          )}
          {invoice.status === 'paid' && (
            <button
              onClick={() => handleStatusChange('unpaid')}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Mark as Unpaid
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg" ref={invoiceRef}>
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-32">Invoice Number:</span>
                  <span className="text-sm text-gray-900">#{invoice.invoice_number}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-32">Issue Date:</span>
                  <span className="text-sm text-gray-900">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-32">Due Date:</span>
                  <span className="text-sm text-gray-900">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-32">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    invoice.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : invoice.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Client Information</h3>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">{invoice.clients.name}</div>
                {invoice.clients.company && (
                  <div className="text-sm text-gray-500">{invoice.clients.company}</div>
                )}
                {invoice.clients.address && (
                  <div className="text-sm text-gray-500">{invoice.clients.address}</div>
                )}
                {invoice.clients.email && (
                  <div className="text-sm text-gray-500">{invoice.clients.email}</div>
                )}
                {invoice.clients.phone && (
                  <div className="text-sm text-gray-500">{invoice.clients.phone}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.products.name}
                      {item.products.description && (
                        <p className="text-xs text-gray-500">{item.products.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap"></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                    ${invoice.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-6 w-6 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Notes</h3>
            </div>
            <div className="text-sm text-gray-500 whitespace-pre-line">
              {invoice.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceViewPage;