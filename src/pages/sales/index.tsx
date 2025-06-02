import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { OrderCard } from "@/components/OrderCard";
import type { NextPageWithLayout } from "../_app";
import type { ReactElement } from "react";
import { useState } from "react";
import { api } from "@/utils/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatus } from "@prisma/client";
import { toast } from "sonner";
import { toRupiah } from "@/utils/toRupiah";

const SalesPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();
  const [filterOrder, setFilterOrder] = useState<OrderStatus | "ALL">("ALL")
  const { data: orders } = api.order.getOrders.useQuery({ status: filterOrder })
  const { data: salesReport } = api.order.getSalesReport.useQuery()
  
  const {mutate: finishOrder, isPending: isFinishOrderPending, variables:finishOrderVariable } = api.order.finishOrder.useMutation({
    onSuccess: async () => {
      await apiUtils.order.getOrders.invalidate();
      toast("Order FInished!")
    }
  })

  const handleFinishOrder = (orderId: string) => {
    finishOrder({ orderId })
  };

  const handleFilterOrderChange = (value: OrderStatus | 'ALL') => {
    setFilterOrder(value);
  }

  return (
    <>
      <DashboardHeader>
        <DashboardTitle>Sales Dashboard</DashboardTitle>
        <DashboardDescription>
          Track your sales performance and view analytics.
        </DashboardDescription>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold">{toRupiah(salesReport?.totalRevenue ?? 0)}</p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Ongoing Orders</h3>
          <p className="mt-2 text-3xl font-bold">{salesReport?.totalOngoingOrder ?? 0}</p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Completed Orders</h3>
          <p className="mt-2 text-3xl font-bold">{salesReport?.totalCompletedOrder}</p>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium mb-4">Orders</h3>

          <Select defaultValue="ALL" onValueChange={handleFilterOrderChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="ALL">All</SelectItem>
              {
                Object.keys(OrderStatus).map((orderStatus) => {
                  return (
                    <SelectItem value={orderStatus}>{
                      /**  @ts-expect-error will fix later */
                      OrderStatus[orderStatus]
                    }</SelectItem>
                  )
                })
              }
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders?.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              totalAmount={order.grandTotal}
              totalItems={order._count.orderItems}
              status={order.status}
              onFinishOrder={() => handleFinishOrder(order.id)}
              isFinishingOrder={isFinishOrderPending && order.id === finishOrderVariable.orderId}
            />
          ))}
        </div>
      </div>
    </>
  );
};

SalesPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SalesPage; 