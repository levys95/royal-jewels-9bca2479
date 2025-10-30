import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Accès refusé - Authentification requise");
          navigate("/auth");
          return;
        }

        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          toast.error("Erreur lors de la vérification des droits");
          navigate("/");
          return;
        }

        if (!roles) {
          toast.error("Accès refusé - Droits administrateur requis");
          navigate("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error in admin check:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [navigate]);

  return { isAdmin, isLoading };
};
