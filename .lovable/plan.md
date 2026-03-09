

## Problem

The seller dashboard query on line 151 uses `profiles!orders_user_id_fkey(display_name, email, phone)` to join buyer profiles, but there is **no foreign key** between `orders.user_id` and `profiles.id`. This causes the join to silently return `null`, showing "N/A" for all customer names.

## Solution

Change `fetchData` to fetch orders and buyer profiles separately:

1. **Fetch orders** with `order_items` only (no profile join)
2. **Extract unique `user_id`s** from the orders
3. **Fetch profiles** for those user IDs in a separate query
4. **Map buyer profiles** into a `buyers` Record and attach to each order before setting state (or pass alongside)
5. **Update all references** to `order.profiles?.display_name` to use the buyers map instead

### Files to change

**`src/pages/SellerDashboard.tsx`**:
- Line ~148-155: Rewrite `fetchData` to:
  - Query orders without the profile join: `supabase.from("orders").select("*, order_items(*)").eq("seller_id", userId)`
  - Collect unique `user_id` values from orders
  - Fetch buyer profiles: `supabase.from("profiles").select("id, display_name, email, phone").in("id", buyerIds)`
  - Build a `buyersMap: Record<string, Profile>` and store in a new state variable `buyers`
- Add `const [buyers, setBuyers] = useState<Record<string, any>>({});`
- Update lines ~409, ~484, ~319 where `order.profiles?.display_name` is used to instead read `buyers[order.user_id]?.display_name`
- Pass `buyers` to `OrdersSection` and `DashboardSection` components

