import { Layouts } from '@/types';

export const defaultLayouts: Layouts = {
  breakfast: {
    tables: [
      {
        id: "shift_manager",
        name: "Shift Manager",
        columns: ["Manager on Duty"]
      },
      {
        id: "handheld",
        name: "Handheld",
        columns: ["Staff"]
      },
      {
        id: "window1",
        name: "Window 1",
        columns: ["Order Takes", "Cashier"]
      },
      {
        id: "window2",
        name: "Window 2",
        columns: ["Presenter", "Checker", "Runner", "Holds"]
      },
      {
        id: "front_hand_wash",
        name: "Front Hand Wash",
        columns: ["Staff"]
      },
      {
        id: "order_assembly",
        name: "Order Assembly",
        columns: ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"]
      },
      {
        id: "kitchen_leader",
        name: "Kitchen Leader/Hand Wash",
        columns: ["Staff"]
      },
      {
        id: "line1",
        name: "Line 1",
        columns: ["Screen", "Rolls"]
      },
      {
        id: "line2",
        name: "Line 2",
        columns: ["Screen", "Rolls"]
      },
      {
        id: "batch",
        name: "Batch",
        columns: ["Muffins", "Sausage", "Eggs"]
      },
      {
        id: "oven",
        name: "Oven",
        columns: ["Staff"]
      },
      {
        id: "backroom",
        name: "Backroom/Change Over",
        columns: ["Staff"]
      },
      {
        id: "hash_browns",
        name: "Hash browns",
        columns: ["Staff"]
      },
      {
        id: "customer_care",
        name: "Customer Care",
        columns: ["Staff"]
      },
      {
        id: "beverage_cell",
        name: "Beverage Cell",
        columns: ["Soft Drinks", "Shakes", "Hot Drinks"]
      },
      {
        id: "breaks",
        name: "Breaks",
        columns: ["Kitchen", "Front"]
      },
      {
        id: "dive",
        name: "DIVE",
        columns: ["09:00", "11:00"]
      }
    ]
  },
  dayPart: {
    tables: [
      {
        id: "shift_manager",
        name: "Shift Manager",
        columns: ["Manager on Duty"]
      },
      {
        id: "handheld",
        name: "Handheld",
        columns: ["Staff"]
      },
      {
        id: "window1",
        name: "Window 1",
        columns: ["Order Takes", "Cashier"]
      },
      {
        id: "window2",
        name: "Window 2",
        columns: ["Presenter", "Checker", "Runner", "Holds"]
      },
      {
        id: "front_hand_wash",
        name: "Front Hand Wash",
        columns: ["Staff"]
      },
      {
        id: "order_assembly",
        name: "Order Assembly",
        columns: ["1. R/P", "2. R/P", "3. Delivery checker", "4. Expeditator", "5. Delivery Drinks"]
      },
      {
        id: "kitchen_leader",
        name: "Kitchen Leader/Hand Wash",
        columns: ["Staff"]
      },
      {
        id: "line1",
        name: "Line 1",
        columns: ["Initiator", "Assembler", "Finisher"]
      },
      {
        id: "line2",
        name: "Line 2",
        columns: ["Initiator", "Assembler", "Finisher"]
      },
      {
        id: "batch_grill",
        name: "Batch Grill",
        columns: ["Staff"]
      },
      {
        id: "batch_chicken",
        name: "Batch Chicken",
        columns: ["Staff"]
      },
      {
        id: "backroom",
        name: "Backroom",
        columns: ["Staff"]
      },
      {
        id: "fries",
        name: "Fries",
        columns: ["Staff"]
      },
      {
        id: "customer_care",
        name: "Customer Care",
        columns: ["Staff"]
      },
      {
        id: "beverage_cell",
        name: "Beverage Cell",
        columns: ["Soft Drinks", "Shakes", "Hot Drinks"]
      },
      {
        id: "breaks",
        name: "Breaks",
        columns: ["Kitchen", "Front"]
      },
      {
        id: "dive",
        name: "DIVE",
        columns: ["11:00", "15:00", "19:00", "CLOSE"]
      },
      {
        id: "delivery",
        name: "DELIVERY",
        columns: ["Staff"]
      }
    ]
  }
};
