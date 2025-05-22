import { z } from 'zod';

// Client Schema
export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format').optional().nullable(),
  company: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Employee Schema
export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(2, 'Role is required'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format').optional().nullable(),
  address: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'on_leave']),
});

// Product Schema
export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  type: z.enum(['product', 'service']),
  status: z.enum(['active', 'inactive']),
});

// Invoice Schema
export const invoiceSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be greater than or equal to 0'),
  })).min(1, 'At least one item is required'),
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type EmployeeFormData = z.infer<typeof employeeSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;