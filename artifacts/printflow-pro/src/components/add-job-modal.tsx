import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePrintJob, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { PrintJobInputPrintType, PrintJobInputPaperSize, PrintJobInputPaperType } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  printerName: z.string().min(1, "Printer name is required"),
  pages: z.coerce.number().min(1, "Must be at least 1 page"),
  printType: z.enum(["BW", "Color", "Glossy", "Photo"]),
  paperSize: z.enum(["A4", "A3"]),
  paperType: z.enum(["Plain", "Glossy", "Photo"]),
});

export function AddPrintJobModal() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createJob = useCreatePrintJob();
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() }});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printerName: "",
      pages: 1,
      printType: "BW",
      paperSize: "A4",
      paperType: "Plain",
    },
  });

  const watchedValues = form.watch();

  const calculateEstimate = () => {
    if (!settings) return 0;
    const { pages, printType, paperSize, paperType } = watchedValues;
    let rate = 0;
    
    if (paperType === "Glossy") rate = settings.glossyPrice;
    else if (paperType === "Photo") rate = settings.photoPrice;
    else if (printType === "BW" && paperSize === "A4") rate = settings.bwA4Price;
    else if (printType === "BW" && paperSize === "A3") rate = settings.bwA3Price;
    else if (printType === "Color" && paperSize === "A4") rate = settings.colorA4Price;
    else if (printType === "Color" && paperSize === "A3") rate = settings.colorA3Price;

    return rate * pages;
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createJob.mutate(
      { data: values as any },
      {
        onSuccess: () => {
          toast({ title: "Print job added successfully" });
          setOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: ["/api/print-jobs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/daily-summary"] });
        },
        onError: () => {
          toast({ title: "Failed to add print job", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="element-radius bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-[0_0_20px_rgba(180,255,57,0.3)]">
          <Plus className="w-4 h-4 mr-2" />
          Add Print Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] card-radius border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Print Job</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="printerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Printer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. HP LaserJet 1" className="element-radius bg-background border-border" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pages</FormLabel>
                    <FormControl>
                      <Input type="number" className="element-radius bg-background border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paperSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="element-radius bg-background border-border">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="printType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Print Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="element-radius bg-background border-border">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BW">B&W</SelectItem>
                        <SelectItem value="Color">Color</SelectItem>
                        <SelectItem value="Glossy">Glossy</SelectItem>
                        <SelectItem value="Photo">Photo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paperType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="element-radius bg-background border-border">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Plain">Plain</SelectItem>
                        <SelectItem value="Glossy">Glossy</SelectItem>
                        <SelectItem value="Photo">Photo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="bg-background/50 p-4 rounded-xl border border-border flex justify-between items-center mt-4">
              <span className="text-muted-foreground text-sm font-medium">Estimated Amount</span>
              <span className="text-xl font-bold text-primary">₹{calculateEstimate()}</span>
            </div>

            <Button type="submit" className="w-full element-radius mt-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={createJob.isPending}>
              {createJob.isPending ? "Adding..." : "Confirm Print Job"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
