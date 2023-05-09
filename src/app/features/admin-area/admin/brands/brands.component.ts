import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { BrandService } from 'src/app/core/services/brand.service';
import { IBrand } from 'src/app/shared/models/brand';

@Component({
  selector: 'app-brands',
  templateUrl: './brands.component.html',
  styleUrls: ['./brands.component.scss']
})
export class BrandsComponent implements OnInit, AfterViewInit {

  constructor(private brandService: BrandService, private router: Router) { }

  columnsToDisplay: string[] = ['id', 'name', 'isActive', 'Action'];
  brands: IBrand[] = [];

  ngOnInit(): void {
    //this.loadData();
  }

  ngAfterViewInit() {
    this.loadData();
  }

  loadData() {
    this.brandService.getBrands().pipe(tap(data => console.log(data))).subscribe((response) => {
      this.brands = response;
    });
  }

  editBrand(id: number) {
    this.router.navigateByUrl("/admin/brands/edit/" + id);
  }
}
