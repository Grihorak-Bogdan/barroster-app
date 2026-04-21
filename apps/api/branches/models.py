from uuid import uuid4

from django.db import models


class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=150)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "branches"
        ordering = ["name"]

    def __str__(self):
        return self.name