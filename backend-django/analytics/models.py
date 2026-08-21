"""
Analytics — modelos somente-leitura (managed=False) espelhando o schema Postgres principal.
Django aqui atua como BI/analytics, não como fonte da verdade.
"""
from django.db import models

class Product(models.Model):
    id = models.UUIDField(primary_key=True)
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=100, null=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2)
    minimum_quantity = models.IntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'products'
        managed = False

    @property
    def final_price(self):
        # Regra financeira JS-style: custo * 1.20
        return round(float(self.cost_price) * 1.20, 2)

    @property
    def is_brahma_pepsi(self):
        return self.brand in ('Brahma', 'Pepsi')

class Stock(models.Model):
    id = models.UUIDField(primary_key=True)
    warehouse_id = models.UUIDField()
    product = models.ForeignKey(Product, on_delete=models.DO_NOTHING, db_column='product_id')
    quantity = models.IntegerField()
    reserved_quantity = models.IntegerField()

    class Meta:
        db_table = 'stock'
        managed = False

    @property
    def is_below_minimum(self):
        return self.quantity < self.product.minimum_quantity

class Order(models.Model):
    id = models.UUIDField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=20)  # CONSUMER / B2B
    status = models.CharField(max_length=20)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField()

    class Meta:
        db_table = 'orders'
        managed = False
