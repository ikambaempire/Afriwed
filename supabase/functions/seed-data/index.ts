import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    // 1. Create admin user
    const { data: adminUser, error: adminErr } = await admin.auth.admin.createUser({
      email: "fiston.ikamba1@gmail.com",
      password: "Admin@2024",
      email_confirm: true,
      user_metadata: { full_name: "Fiston Ikamba" },
    });
    
    let adminUserId = adminUser?.user?.id;
    if (adminErr && adminErr.message.includes("already been registered")) {
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === "fiston.ikamba1@gmail.com");
      adminUserId = existing?.id;
    }

    if (adminUserId) {
      await admin.from("user_roles").upsert({ user_id: adminUserId, role: "admin" }, { onConflict: "user_id,role" });
    }

    // 2. Create dummy vendor users
    const vendorData = [
      { email: "serena@demo.rw", name: "Serena Hotels", biz: "Serena Kigali Garden", cat: "venues", price: 500000, desc: "Premium wedding venue in the heart of Kigali", loc: "Kigali", img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800" },
      { email: "mugisha@demo.rw", name: "Jean Mugisha", biz: "Mugisha Photography", cat: "photographers", price: 300000, desc: "Award-winning wedding photographer capturing your special moments", loc: "Kigali", img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800" },
      { email: "amahoro@demo.rw", name: "Amahoro Team", biz: "Amahoro Catering", cat: "catering", price: 200000, desc: "Exquisite Rwandan and international cuisine for your wedding", loc: "Musanze", img: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800" },
      { email: "belle@demo.rw", name: "Belle Décor", biz: "Belle Déco Rwanda", cat: "decorators", price: 400000, desc: "Transform your venue into a wedding paradise", loc: "Kigali", img: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800" },
      { email: "ineza@demo.rw", name: "Ineza Beauty", biz: "Ineza Makeup Studio", cat: "makeup_artists", price: 150000, desc: "Bridal makeup that brings out your natural beauty", loc: "Kigali", img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800" },
      { email: "umurava@demo.rw", name: "Umurava Sound", biz: "Umurava Sound & Lights", cat: "sound_lighting", price: 250000, desc: "Professional sound and lighting for unforgettable events", loc: "Huye", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800" },
      { email: "vipcar@demo.rw", name: "VIP Cars", biz: "VIP Car Hire Kigali", cat: "car_hire", price: 350000, desc: "Luxury bridal cars and fleet for your wedding convoy", loc: "Kigali", img: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=800" },
      { email: "bruno@demo.rw", name: "MC Bruno", biz: "MC Bruno Events", cat: "mc_entertainment", price: 180000, desc: "Keep your guests entertained all night long", loc: "Kigali", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800" },
    ];

    const vendorIds: string[] = [];

    for (const v of vendorData) {
      const { data: vUser } = await admin.auth.admin.createUser({
        email: v.email,
        password: "Vendor@2024",
        email_confirm: true,
        user_metadata: { full_name: v.name },
      });

      const userId = vUser?.user?.id;
      if (!userId) continue;

      await admin.from("user_roles").upsert({ user_id: userId, role: "vendor" }, { onConflict: "user_id,role" });

      const { data: vendor } = await admin.from("vendors").upsert({
        user_id: userId,
        business_name: v.biz,
        category: v.cat,
        description: v.desc,
        location: v.loc,
        email: v.email,
        cover_image_url: v.img,
        starting_price: v.price,
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        review_count: Math.floor(20 + Math.random() * 100),
        is_approved: true,
        is_verified: Math.random() > 0.3,
        is_featured: Math.random() > 0.5,
      }, { onConflict: "user_id" }).select().single();

      if (vendor) {
        vendorIds.push(vendor.id);

        // Add services
        await admin.from("vendor_services").insert([
          { vendor_id: vendor.id, name: "Basic Package", price: v.price, duration: "Half Day", description: "Essential coverage for intimate ceremonies" },
          { vendor_id: vendor.id, name: "Premium Package", price: v.price * 2, duration: "Full Day", description: "Complete coverage with premium service" },
          { vendor_id: vendor.id, name: "Platinum Package", price: v.price * 3, duration: "2 Days", description: "Our all-inclusive luxury package" },
        ]);

        // Add media
        const images = [
          `https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600`,
          `https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600`,
          `https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600`,
        ];
        await admin.from("vendor_media").insert(
          images.map(url => ({ vendor_id: vendor.id, url, media_type: "image" }))
        );
      }
    }

    // 3. Create dummy client and bookings/transactions
    const { data: clientUser } = await admin.auth.admin.createUser({
      email: "client@demo.rw",
      password: "Client@2024",
      email_confirm: true,
      user_metadata: { full_name: "Amara Uwimana" },
    });

    const clientId = clientUser?.user?.id;
    if (clientId) {
      await admin.from("user_roles").upsert({ user_id: clientId, role: "client" }, { onConflict: "user_id,role" });

      for (let i = 0; i < Math.min(vendorIds.length, 5); i++) {
        const amount = [500000, 300000, 400000, 200000, 350000][i];
        const statuses = ["pending", "confirmed", "completed", "confirmed", "pending"];
        const { data: booking } = await admin.from("bookings").insert({
          client_id: clientId,
          vendor_id: vendorIds[i],
          event_date: `2025-${String(3 + i).padStart(2, "0")}-15`,
          status: statuses[i],
          total_amount: amount,
          deposit_amount: Math.floor(amount * 0.3),
          notes: "Wedding reception booking",
        }).select().single();

        if (booking) {
          const txStatuses = ["completed", "completed", "completed", "pending", "pending"];
          const methods = ["momo", "airtel", "card", "momo", "momo"];
          await admin.from("transactions").insert({
            booking_id: booking.id,
            vendor_id: vendorIds[i],
            client_id: clientId,
            amount: amount,
            commission: Math.floor(amount * 0.1),
            payment_method: methods[i],
            status: txStatuses[i],
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Seed data created!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
