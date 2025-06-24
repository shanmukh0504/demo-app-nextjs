import { OrderStatus, OrderWithStatus, ParseOrderStatus } from "@gardenfi/core";
import { BlockchainType, IOrderbook, MatchedOrder } from "@gardenfi/orderbook";
import { create } from "zustand";
import {
  getLatestUpdatedOrder,
  getLatestUpdatedOrders,
} from "../utils/getLatestUpdatedOrder";
import { blockNumberStore } from "./blockNumberStore";

type OrdersStore = {
  pendingOrders: OrderWithStatus[];
  orderInProgress: OrderWithStatus | null;
  ordersHistory: {
    orders: OrderWithStatus[];
    totalItems: number;
    error: string;
    perPage: number;
    fetchAndSetOrders: (
      orderBook: IOrderbook,
      connectedWallets: {
        [key in BlockchainType]: string;
      }
    ) => Promise<void>;
    loadMore: (orderBook: IOrderbook, connectedWallets: {
      [key in BlockchainType]: string;
    }) => Promise<void>;
  };

  setPendingOrders: (orders: OrderWithStatus[]) => void;
  setOrderInProgress: (order: OrderWithStatus | null) => void;
  updateOrder: (order: OrderWithStatus) => void;
};

const filterPendingOrders = (orders: OrderWithStatus[]) =>
  orders.filter((order) => order.status !== OrderStatus.RedeemDetected);

const mergeOrders = (
  orders: OrderWithStatus[],
  existingOrders: OrderWithStatus[]
) => getLatestUpdatedOrders(orders, existingOrders);

const updateSingleOrder = (
  newOrder: OrderWithStatus,
  existingOrders: OrderWithStatus[]
) =>
  existingOrders.map((order) =>
    order.create_order.create_id === newOrder.create_order.create_id
      ? getLatestUpdatedOrder(newOrder, order)
      : order
  );

export const ordersStore = create<OrdersStore>((set, get) => ({
  pendingOrders: [],
  orderInProgress: null,
  ordersHistory: {
    orders: [],
    totalItems: 0,
    error: "",
    perPage: 4,

    fetchAndSetOrders: async (
      orderBook: IOrderbook, connectedWallets: {
        [key in BlockchainType]: string;
      }) => {
      const state = get();
      const blockNumbers = blockNumberStore.getState().blockNumbers;
      if (!blockNumbers) return;
      const transactions: MatchedOrder[] = [];
      let totalItems = 0;

      for (const [, address] of Object.entries(connectedWallets)) {
        if (address === "") continue;
        const res = await orderBook.getMatchedOrders(address, "all", {
          per_page: state.ordersHistory.perPage,
        });
        if (!res.ok) {
          set((prev) => ({
            ordersHistory: {
              ...prev.ordersHistory,
              error: res.error || "Error fetching orders",
            },
          }));
          return;
        }
        totalItems += res.val.total_items;
        transactions.push(...res.val.data);
      }
      transactions.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      set({ transactions, totalItems });
      const ordersWithStatus = transactions
        .map((order) => {
          const { source_swap, destination_swap } = order;
          const sourceBlockNumber = blockNumbers[source_swap.chain];
          const destinationBlockNumber = blockNumbers[destination_swap.chain];
          if (!sourceBlockNumber || !destinationBlockNumber) return;

          return {
            ...order,
            status: ParseOrderStatus(
              order,
              sourceBlockNumber,
              destinationBlockNumber
            ),
          };
        })
        .filter(Boolean) as OrderWithStatus[];

      set({
        pendingOrders: mergeOrders(state.pendingOrders, ordersWithStatus),
        ordersHistory: {
          ...state.ordersHistory,
          orders: mergeOrders(ordersWithStatus, state.ordersHistory.orders),
          totalItems: totalItems,
          error: "",
          perPage: 4,
        },
      });
    },
    loadMore: async (orderBook, address) => {
      set((prev) => ({
        ordersHistory: {
          ...prev.ordersHistory,
          perPage: prev.ordersHistory.perPage + 4,
        },
      }));
      await get().ordersHistory.fetchAndSetOrders(orderBook, address);
    },
  },

  setPendingOrders: (orders) => {
    const state = get();
    set({
      pendingOrders: filterPendingOrders(
        mergeOrders(orders, state.pendingOrders)
      ),
      orderInProgress: state.orderInProgress
        ? (() => {
          const foundOrder = orders.find(
            (o) =>
              o.create_order.create_id ===
              state.orderInProgress?.create_order.create_id
          );
          return foundOrder
            ? getLatestUpdatedOrder(foundOrder, state.orderInProgress)
            : state.orderInProgress;
        })()
        : state.orderInProgress,
      ordersHistory: {
        ...state.ordersHistory,
        orders: mergeOrders(state.ordersHistory.orders, orders),
      },
    });
  },

  setOrderInProgress: (order) => {
    if (!order) {
      set({
        orderInProgress: null,
      });
      return;
    }
    const state = get();
    set({
      pendingOrders: filterPendingOrders(
        updateSingleOrder(order, state.pendingOrders)
      ),
      orderInProgress:
        state.orderInProgress &&
          order.create_order.create_id ===
          state.orderInProgress.create_order.create_id
          ? getLatestUpdatedOrder(order, state.orderInProgress)
          : order,
      ordersHistory: {
        ...state.ordersHistory,
        orders: updateSingleOrder(order, state.ordersHistory.orders),
      },
    });
  },

  updateOrder: (order) => {
    const state = get();
    set({
      pendingOrders: filterPendingOrders(
        updateSingleOrder(order, state.pendingOrders)
      ),
      orderInProgress:
        state.orderInProgress &&
          order.create_order.create_id ===
          state.orderInProgress.create_order.create_id
          ? getLatestUpdatedOrder(order, state.orderInProgress)
          : state.orderInProgress,
      ordersHistory: {
        ...state.ordersHistory,
        orders: updateSingleOrder(order, state.ordersHistory.orders),
      },
    });
  },
}));
