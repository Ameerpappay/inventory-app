BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[suppliers] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [zip_code] NVARCHAR(1000),
    [contact_person] NVARCHAR(1000),
    [website] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [suppliers_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [suppliers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [suppliers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[customers] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [zip_code] NVARCHAR(1000),
    [contact_person] NVARCHAR(1000),
    [company_type] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [is_active] BIT NOT NULL CONSTRAINT [customers_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [customers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [customers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sales_orders] (
    [id] NVARCHAR(1000) NOT NULL,
    [order_number] NVARCHAR(1000) NOT NULL,
    [customer_name] NVARCHAR(1000) NOT NULL,
    [customer_email] NVARCHAR(1000) NOT NULL,
    [total_amount] FLOAT(53) NOT NULL CONSTRAINT [sales_orders_total_amount_df] DEFAULT 0.0,
    [status] INT NOT NULL CONSTRAINT [sales_orders_status_df] DEFAULT 0,
    [order_date] DATE NOT NULL CONSTRAINT [sales_orders_order_date_df] DEFAULT CURRENT_TIMESTAMP,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sales_orders_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [user_id] NVARCHAR(1000) NOT NULL,
    [customer_id] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    CONSTRAINT [sales_orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sales_orders_order_number_key] UNIQUE NONCLUSTERED ([order_number])
);

-- CreateTable
CREATE TABLE [dbo].[sales_order_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [unit_price] FLOAT(53) NOT NULL,
    [total_price] FLOAT(53) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sales_order_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [sales_order_id] NVARCHAR(1000) NOT NULL,
    [inventory_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [sales_order_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[purchase_orders] (
    [id] NVARCHAR(1000) NOT NULL,
    [po_number] NVARCHAR(1000) NOT NULL,
    [supplier_name] NVARCHAR(1000) NOT NULL,
    [supplier_email] NVARCHAR(1000) NOT NULL,
    [total_amount] FLOAT(53) NOT NULL CONSTRAINT [purchase_orders_total_amount_df] DEFAULT 0.0,
    [status] INT NOT NULL CONSTRAINT [purchase_orders_status_df] DEFAULT 0,
    [order_date] DATE NOT NULL CONSTRAINT [purchase_orders_order_date_df] DEFAULT CURRENT_TIMESTAMP,
    [expected_delivery] DATE NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [purchase_orders_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [user_id] NVARCHAR(1000) NOT NULL,
    [supplier_id] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    CONSTRAINT [purchase_orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [purchase_orders_po_number_key] UNIQUE NONCLUSTERED ([po_number])
);

-- CreateTable
CREATE TABLE [dbo].[purchase_order_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [cost_per_unit] FLOAT(53) NOT NULL,
    [total_cost] FLOAT(53) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [purchase_order_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [purchase_order_id] NVARCHAR(1000) NOT NULL,
    [inventory_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [purchase_order_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[inventory] (
    [id] NVARCHAR(1000) NOT NULL,
    [product_name] NVARCHAR(1000) NOT NULL,
    [sku] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL CONSTRAINT [inventory_category_df] DEFAULT 'Other',
    [quantity] INT NOT NULL CONSTRAINT [inventory_quantity_df] DEFAULT 0,
    [unit_price] FLOAT(53) NOT NULL CONSTRAINT [inventory_unit_price_df] DEFAULT 0.0,
    [reorder_level] INT NOT NULL CONSTRAINT [inventory_reorder_level_df] DEFAULT 10,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [inventory_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [supplier_id] NVARCHAR(1000),
    CONSTRAINT [inventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [inventory_sku_key] UNIQUE NONCLUSTERED ([sku])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [suppliers_user_id_idx] ON [dbo].[suppliers]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [suppliers_name_idx] ON [dbo].[suppliers]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [suppliers_is_active_idx] ON [dbo].[suppliers]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [customers_user_id_idx] ON [dbo].[customers]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [customers_name_idx] ON [dbo].[customers]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [customers_is_active_idx] ON [dbo].[customers]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_orders_user_id_idx] ON [dbo].[sales_orders]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_orders_status_idx] ON [dbo].[sales_orders]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_orders_order_date_idx] ON [dbo].[sales_orders]([order_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_orders_customer_id_idx] ON [dbo].[sales_orders]([customer_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_order_items_sales_order_id_idx] ON [dbo].[sales_order_items]([sales_order_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_order_items_inventory_id_idx] ON [dbo].[sales_order_items]([inventory_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_user_id_idx] ON [dbo].[purchase_orders]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_status_idx] ON [dbo].[purchase_orders]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_order_date_idx] ON [dbo].[purchase_orders]([order_date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_supplier_id_idx] ON [dbo].[purchase_orders]([supplier_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_order_items_purchase_order_id_idx] ON [dbo].[purchase_order_items]([purchase_order_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_order_items_inventory_id_idx] ON [dbo].[purchase_order_items]([inventory_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [inventory_user_id_idx] ON [dbo].[inventory]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [inventory_category_idx] ON [dbo].[inventory]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [inventory_sku_idx] ON [dbo].[inventory]([sku]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [inventory_supplier_id_idx] ON [dbo].[inventory]([supplier_id]);

-- AddForeignKey
ALTER TABLE [dbo].[suppliers] ADD CONSTRAINT [suppliers_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[customers] ADD CONSTRAINT [customers_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sales_orders] ADD CONSTRAINT [sales_orders_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sales_orders] ADD CONSTRAINT [sales_orders_customer_id_fkey] FOREIGN KEY ([customer_id]) REFERENCES [dbo].[customers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sales_order_items] ADD CONSTRAINT [sales_order_items_sales_order_id_fkey] FOREIGN KEY ([sales_order_id]) REFERENCES [dbo].[sales_orders]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sales_order_items] ADD CONSTRAINT [sales_order_items_inventory_id_fkey] FOREIGN KEY ([inventory_id]) REFERENCES [dbo].[inventory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_supplier_id_fkey] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_order_items] ADD CONSTRAINT [purchase_order_items_purchase_order_id_fkey] FOREIGN KEY ([purchase_order_id]) REFERENCES [dbo].[purchase_orders]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_order_items] ADD CONSTRAINT [purchase_order_items_inventory_id_fkey] FOREIGN KEY ([inventory_id]) REFERENCES [dbo].[inventory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[inventory] ADD CONSTRAINT [inventory_supplier_id_fkey] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
