import { Page } from "@playwright/test";
import { expect } from "./testSetup";
import { Role } from "../src/service/pizzaService";
import type {
  Endpoints,
  Franchise,
  Order,
  Pizza,
  User,
} from "../src/service/pizzaService";

/**
 * Shared test data and route mocks for the JWT Pizza frontend.
 *
 * Every test installs `installApiMocks(page, ...)` before navigating. The
 * helper registers a handler for each backend endpoint the frontend can call,
 * so the `testSetup` guard never sees an un-mocked request to the real service.
 */

export const diner: User = {
  id: "3",
  name: "Kai Chen",
  email: "d@jwt.com",
  password: "a",
  roles: [{ role: Role.Diner }],
};

export const franchisee: User = {
  id: "2",
  name: "Fran Franchise",
  email: "f@jwt.com",
  password: "a",
  roles: [{ role: Role.Franchisee, objectId: "2" }],
};

export const admin: User = {
  id: "1",
  name: "Ada Admin",
  email: "a@jwt.com",
  password: "a",
  roles: [{ role: Role.Admin }],
};

export const users: User[] = [diner, franchisee, admin];

export const menu: Pizza[] = [
  {
    id: "1",
    title: "Veggie",
    image: "pizza1.png",
    price: 0.0038,
    description: "A garden of delight",
  },
  {
    id: "2",
    title: "Pepperoni",
    image: "pizza2.png",
    price: 0.0042,
    description: "Spicy treat",
  },
];

export const alphaFranchise: Franchise = {
  id: "2",
  name: "LotaPizza",
  admins: [{ id: "2", name: "Fran Franchise", email: "f@jwt.com" }],
  stores: [
    { id: "4", name: "Lehi", totalRevenue: 1234 },
    { id: "5", name: "Springville", totalRevenue: 567 },
  ],
};

export const betaFranchise: Franchise = {
  id: "3",
  name: "PizzaCorp",
  admins: [{ id: "1", name: "Ada Admin", email: "a@jwt.com" }],
  stores: [{ id: "7", name: "Spanish Fork", totalRevenue: 0 }],
};

export const orders: Order[] = [
  {
    id: "23",
    franchiseId: "2",
    storeId: "4",
    date: "2024-01-01",
    items: [{ menuId: "1", description: "Veggie", price: 0.0038 }],
  },
  {
    id: "24",
    franchiseId: "2",
    storeId: "4",
    date: "2024-01-02",
    items: [
      { menuId: "1", description: "Veggie", price: 0.0038 },
      { menuId: "2", description: "Pepperoni", price: 0.0042 },
    ],
  },
];

const serviceDocs: Endpoints = {
  endpoints: [
    {
      requiresAuth: false,
      method: "GET",
      path: "/api/order/menu",
      description: "Get the pizza menu",
      example: "curl http://localhost:3000/api/order/menu",
      response: [],
    },
    {
      requiresAuth: true,
      method: "PUT",
      path: "/api/auth",
      description: "Login with an email and password",
      example: "curl -X PUT http://localhost:3000/api/auth",
      response: { user: {}, token: "jwt" },
    },
  ],
};

const factoryDocs: Endpoints = {
  endpoints: [
    {
      requiresAuth: false,
      method: "POST",
      path: "/api/order/verify",
      description: "Verify a pizza order JWT",
      example: "curl -X POST https://pizza-factory.cs329.click/api/order/verify",
      response: { message: "valid" },
    },
  ],
};

export interface ApiOptions {
  /** User to consider logged in. Also seeds a token so the app restores the session on load. */
  user?: User | null;
  /** Make `GET /api/user/me` fail (used for the expired-session path). */
  userMeError?: boolean;
  menu?: Pizza[];
  franchises?: Franchise[];
  /** Result of `GET /api/franchise/:id` (the current franchisee's franchises). */
  franchise?: Franchise[];
  orders?: Order[];
  /** Make `POST /api/order` fail (used for the payment error path). */
  orderError?: boolean;
  /** Make the factory's `POST /api/order/verify` fail. */
  verifyInvalid?: boolean;
  docs?: Endpoints;
}

export interface ApiState {
  loggedInUser: User | null;
  franchiseQueries: string[];
  createdFranchises: Franchise[];
  createdStores: { id: string; name: string }[];
  closedFranchises: string[];
  closedStores: string[];
}

/** Register handlers for every frontend endpoint. Call before `page.goto`. */
export async function installApiMocks(
  page: Page,
  options: ApiOptions = {},
): Promise<ApiState> {
  const state: ApiState = {
    loggedInUser: options.user ?? null,
    franchiseQueries: [],
    createdFranchises: [],
    createdStores: [],
    closedFranchises: [],
    closedStores: [],
  };

  const franchiseData = options.franchises ?? [alphaFranchise, betaFranchise];
  const orderHistory = options.orders ?? [];

  if (options.user) {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("token", "test-token");
      } catch {
        // ignore opaque origins such as about:blank
      }
    });
  }

  await page.route("*/**/api/auth", async (route) => {
    const method = route.request().method();
    const body = route.request().postDataJSON();

    if (method === "PUT") {
      const user = users.find(
        (u) => u.email === body.email && u.password === body.password,
      );
      if (!user) {
        await route.fulfill({
          status: 401,
          json: { message: "Unauthorized" },
        });
        return;
      }
      state.loggedInUser = user;
      await route.fulfill({ json: { user, token: "test-token" } });
      return;
    }

    if (method === "POST") {
      const user: User = {
        id: "99",
        name: body.name,
        email: body.email,
        password: body.password,
        roles: [{ role: Role.Diner }],
      };
      state.loggedInUser = user;
      await route.fulfill({ json: { user, token: "test-token" } });
      return;
    }

    if (method === "DELETE") {
      state.loggedInUser = null;
      await route.fulfill({ json: {} });
      return;
    }

    throw new Error(`Unexpected ${method} on /api/auth`);
  });

  await page.route("*/**/api/user/me", async (route) => {
    expect(route.request().method()).toBe("GET");
    if (options.userMeError) {
      await route.fulfill({ status: 500, json: { message: "No session" } });
      return;
    }
    await route.fulfill({ json: state.loggedInUser });
  });

  await page.route(/\/api\/order\/menu$/, async (route) => {
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: options.menu ?? menu });
  });

  await page.route(/\/api\/order\/verify$/, async (route) => {
    expect(route.request().method()).toBe("POST");
    if (options.verifyInvalid) {
      await route.fulfill({
        status: 500,
        json: { message: "invalid JWT. Looks like you have a bad pizza!" },
      });
      return;
    }
    await route.fulfill({
      json: { message: "valid", payload: { id: "23", items: 2 } },
    });
  });

  await page.route(/\/api\/order$/, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        json: {
          id: "1",
          dinerId: state.loggedInUser?.id ?? "0",
          orders: orderHistory,
        },
      });
      return;
    }
    if (method === "POST") {
      if (options.orderError) {
        await route.fulfill({
          status: 500,
          json: { message: "Your card was declined" },
        });
        return;
      }
      const orderReq = route.request().postDataJSON();
      await route.fulfill({
        json: { order: { ...orderReq, id: "23" }, jwt: "eyJpYXQ" },
      });
      return;
    }
    throw new Error(`Unexpected ${method} on /api/order`);
  });

  await page.route(/\/api\/franchise\?[^/]*$/, async (route) => {
    expect(route.request().method()).toBe("GET");
    const url = new URL(route.request().url());
    const name = (url.searchParams.get("name") ?? "*")
      .replaceAll("*", "")
      .toLowerCase();
    const pageNumber = Number(url.searchParams.get("page") ?? "0");
    state.franchiseQueries.push(url.search);

    const matches = franchiseData.filter((f) =>
      f.name.toLowerCase().includes(name),
    );
    await route.fulfill({
      json: { franchises: matches, more: pageNumber === 0 && name === "" },
    });
  });

  await page.route(/\/api\/franchise\/[^/]+$/, async (route) => {
    const method = route.request().method();
    const id = route.request().url().split("/franchise/")[1].split(/[?/]/)[0];
    if (method === "GET") {
      const matches = (options.franchise ?? []).filter((f) => f.id === id);
      await route.fulfill({ json: matches });
      return;
    }
    if (method === "DELETE") {
      state.closedFranchises.push(id);
      await route.fulfill({ json: {} });
      return;
    }
    throw new Error(`Unexpected ${method} on /api/franchise/${id}`);
  });

  await page.route(/\/api\/franchise$/, async (route) => {
    expect(route.request().method()).toBe("POST");
    const body = route.request().postDataJSON();
    state.createdFranchises.push(body);
    await route.fulfill({ json: { ...body, id: "99" } });
  });

  await page.route(/\/api\/franchise\/[^/]+\/store$/, async (route) => {
    expect(route.request().method()).toBe("POST");
    const body = route.request().postDataJSON();
    state.createdStores.push(body);
    await route.fulfill({ json: { ...body, id: "88" } });
  });

  await page.route(/\/api\/franchise\/[^/]+\/store\/[^/]+$/, async (route) => {
    expect(route.request().method()).toBe("DELETE");
    state.closedStores.push(route.request().url());
    await route.fulfill({ json: {} });
  });

  await page.route("**/api/docs", async (route) => {
    expect(route.request().method()).toBe("GET");
    if (options.docs) {
      await route.fulfill({ json: options.docs });
      return;
    }
    const isFactory = route.request().url().includes("pizza-factory");
    await route.fulfill({ json: isFactory ? factoryDocs : serviceDocs });
  });

  return state;
}

/** Fill and submit the login form (the login page must already be open). */
export async function fillLogin(page: Page, user: User): Promise<void> {
  await page.getByRole("textbox", { name: "Email address" }).fill(user.email!);
  await page.getByRole("textbox", { name: "Password" }).fill(user.password!);
  await page.getByRole("button", { name: "Login" }).click();
}

/**
 * Walk the menu and check out, leaving the test on the payment page (or on the
 * login page if the user is not signed in).
 */
export async function orderPizzas(
  page: Page,
  titles: string[],
  storeId = "4",
): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Order now" }).click();
  await page.getByRole("combobox").selectOption(storeId);
  for (const title of titles) {
    await page.getByRole("link", { name: `Image Description ${title}` }).click();
  }
  await expect(page.locator("form")).toContainText(
    `Selected pizzas: ${titles.length}`,
  );
  await page.getByRole("button", { name: "Checkout" }).click();
}
