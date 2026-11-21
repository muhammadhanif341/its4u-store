"use client";

import { deleteProductAction } from "@/app/admin/actions";
import { Icon } from "@/components/Icons";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${name}" permanently? Past orders keep their details.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-danger" data-testid="delete-product">
        <Icon name="trash" className="h-4 w-4" />
        Delete product
      </button>
    </form>
  );
}
